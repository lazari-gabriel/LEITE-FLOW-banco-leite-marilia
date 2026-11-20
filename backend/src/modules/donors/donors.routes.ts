import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRoles } from '../../middlewares/auth.js';
import {
  BLH_COORDS,
  evaluateGoNoGo,
  extractNeighborhood,
  isValidCNS,
  isValidCPF,
  normalizeDigits,
  serializeDonorForRole,
  ZONE_APPROX_COORDS,
} from '../../lib/domain.js';
import { recordAudit } from '../../lib/audit.js';

const donorFormSchema = z.object({
  nome: z.string().trim().min(2),
  bebe: z.string().trim().min(1),
  sus: z.string().trim().min(15),
  cpf: z.string().trim().optional().default(''),
  nascimento: z.string().optional().default(''),
  parto: z.string().min(8),
  telefone: z.string().trim().min(10),
  zona: z.enum(['Norte', 'Sul', 'Oeste', 'Leste', 'Rural']),
  endereco: z.string().trim().min(3),
  lat: z.number().min(-23).max(-21).optional(),
  lng: z.number().min(-51).max(-49).optional(),
  geocodeStatus: z.enum(['verified', 'approximate', 'failed']).optional(),
  vacinaFebre: z.boolean().default(true),
  vacinaDtpa: z.boolean().default(true),
  transfusao: z.string().optional().default('Não'),
  transfusaoData: z.string().optional().nullable(),
  tatuagem: z.string().optional().default('Não'),
  tatuagemData: z.string().optional().nullable(),
  fumo: z.enum(['nao', 'sim_pouco', 'sim_ativo']).default('nao'),
  alcool: z.enum(['nao', 'raro', 'frequente']).default('nao'),
  medicacao: z.string().optional().default(''),
  aguaPotavel: z.boolean().default(true),
  redeEsgoto: z.boolean().default(true),
  renda: z.string().optional().default(''),
  pesoBebe: z.string().optional().default(''),
  apgar: z.string().optional().default(''),
  malformacao: z.enum(['nao', 'sim']).default('nao'),
  intercorrencias: z
    .object({
      infeccao: z.boolean().default(false),
      hipertensao: z.boolean().default(false),
      diabetes: z.boolean().default(false),
      hepatite: z.boolean().default(false),
    })
    .default({ infeccao: false, hipertensao: false, diabetes: false, hepatite: false }),
  equipamento: z.enum(['Freezer', 'Duplex', 'Simples']).default('Duplex'),
  extracao: z.enum(['Ordenha Manual', 'Bomba Elétrica', 'Bomba Manual']).default('Ordenha Manual'),
  produtosJunto: z.boolean().default(false),
  soro1Data: z.string().optional().default(''),
  soro1Res: z.enum(['normal', 'alterada', 'pendente']).default('pendente'),
  soro2Data: z.string().optional().default(''),
  soro2Res: z.enum(['normal', 'alterada', 'pendente']).default('pendente'),
  soro3Data: z.string().optional().default(''),
  soro3Res: z.enum(['normal', 'alterada', 'pendente']).default('pendente'),
  statusCadastro: z.enum(['ativa', 'inativa']).optional(),
});

const statusPatchSchema = z.object({
  statusCadastro: z.enum(['ativa', 'inativa']),
});

function zoneFallbackCoords(zona: string): [number, number] {
  const base = ZONE_APPROX_COORDS[zona] ?? BLH_COORDS;
  return [
    Number((base[0] + (Math.random() - 0.5) * 0.015).toFixed(6)),
    Number((base[1] + (Math.random() - 0.5) * 0.015).toFixed(6)),
  ];
}

export async function donorsRoutes(app: FastifyInstance) {
  // Listar doadoras (projeção LGPD automática para COLETOR_CAMPO)
  app.get(
    '/donors',
    {
      preHandler: [authenticate],
      schema: { tags: ['Doadoras'], summary: 'Listar doadoras cadastradas' },
    },
    async (request) => {
      const donors = await prisma.donor.findMany({
        orderBy: { id: 'desc' },
      });
      return {
        data: donors.map((d) => serializeDonorForRole(d, request.user.role)),
      };
    }
  );

  // Criar doadora (apenas ADMIN e COORDENADOR_BLH)
  app.post(
    '/donors',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Doadoras'], summary: 'Cadastrar nova doadora com triagem Go/No-Go' },
    },
    async (request, reply) => {
      const parsed = donorFormSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          type: 'about:blank',
          title: 'Dados de cadastro inválidos',
          status: 400,
          detail: 'Verifique os campos obrigatórios da ficha de triagem.',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
      const susNormalized = normalizeDigits(data.sus);
      const cpfNormalized = data.cpf ? normalizeDigits(data.cpf) : null;

      if (!isValidCNS(susNormalized)) {
        return reply.status(422).send({
          type: 'about:blank',
          title: 'Cartão SUS inválido',
          status: 422,
          detail: 'Informe um Cartão Nacional de Saúde (SUS) válido de 15 dígitos.',
        });
      }

      if (cpfNormalized && !isValidCPF(cpfNormalized)) {
        return reply.status(422).send({
          type: 'about:blank',
          title: 'CPF inválido',
          status: 422,
          detail: 'O CPF informado possui dígitos verificadores inválidos.',
        });
      }

      // Verificação de duplicidade
      const existing = await prisma.donor.findFirst({
        where: {
          OR: [
            { susNormalized },
            ...(cpfNormalized ? [{ cpfNormalized }] : []),
          ],
        },
      });
      if (existing) {
        return reply.status(409).send({
          type: 'about:blank',
          title: 'Cadastro duplicado',
          status: 409,
          detail: `Já existe uma doadora cadastrada com este documento (${existing.code} — ${existing.nome}).`,
        });
      }

      const verdict = evaluateGoNoGo(data);
      const hasVerifiedCoords = typeof data.lat === 'number' && typeof data.lng === 'number';
      const [lat, lng] = hasVerifiedCoords ? [data.lat!, data.lng!] : zoneFallbackCoords(data.zona);
      const geocodeStatus = hasVerifiedCoords ? data.geocodeStatus || 'verified' : 'approximate';

      const latest = await prisma.donor.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      const nextCodeNum = (latest?.id ?? 0) + 1;
      const code = `DOAD-${String(nextCodeNum).padStart(3, '0')}`;

      const created = await prisma.donor.create({
        data: {
          code,
          nome: data.nome,
          bebe: data.bebe,
          sus: data.sus,
          susNormalized,
          cpf: data.cpf || 'Não informado',
          cpfNormalized,
          nascimento: data.nascimento,
          parto: data.parto,
          telefone: data.telefone,
          endereco: data.endereco,
          bairro: extractNeighborhood(data.endereco),
          zona: data.zona,
          lat,
          lng,
          geocodeStatus,
          vacinaFebre: data.vacinaFebre,
          vacinaDtpa: data.vacinaDtpa,
          transfusao: data.transfusaoData ? data.transfusaoData : data.transfusao || 'Não',
          transfusaoData: data.transfusaoData || null,
          tatuagem: data.tatuagemData ? data.tatuagemData : data.tatuagem || 'Não',
          tatuagemData: data.tatuagemData || null,
          fumo: data.fumo,
          alcool: data.alcool,
          medicacao: data.medicacao || 'Nenhuma',
          aguaPotavel: data.aguaPotavel,
          redeEsgoto: data.redeEsgoto,
          renda: data.renda || null,
          pesoBebe: data.pesoBebe || null,
          apgar: data.apgar || null,
          malformacao: data.malformacao,
          intercorrencias: JSON.stringify(data.intercorrencias),
          equipamento: data.equipamento,
          extracao: data.extracao,
          produtosJunto: data.produtosJunto,
          soro1Data: data.soro1Data || null,
          sorologia1: data.soro1Res,
          soro2Data: data.soro2Data || null,
          sorologia2: data.soro2Res,
          soro3Data: data.soro3Data || null,
          sorologia3: data.soro3Res,
          aptidao: verdict.aptidao,
          statusCadastro: verdict.aptidao === 'Inapta' ? 'inativa' : data.statusCadastro || 'ativa',
          motivoInapta: verdict.approved ? null : verdict.reasons.join(' · '),
          consentAcceptedAt: new Date(),
          dataCadastro: new Date().toISOString().split('T')[0],
        },
      });

      await recordAudit({
        request,
        action: 'DONOR_CREATED',
        entity: 'Donor',
        entityId: created.id,
        details: { code: created.code, zona: created.zona, aptidao: created.aptidao },
      });

      return reply.status(201).send({
        donor: serializeDonorForRole(created, request.user.role),
        verdict,
      });
    }
  );

  // Atualizar doadora existente
  app.put(
    '/donors/:id',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Doadoras'], summary: 'Atualizar ficha e reavaliar triagem Go/No-Go' },
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (isNaN(id)) {
        return reply.status(400).send({ title: 'ID inválido', status: 400 });
      }

      const oldDonor = await prisma.donor.findUnique({ where: { id } });
      if (!oldDonor) {
        return reply.status(404).send({ title: 'Doadora não encontrada', status: 404 });
      }

      const parsed = donorFormSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          title: 'Dados inválidos',
          status: 400,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const data = parsed.data;
      const susNormalized = normalizeDigits(data.sus);
      const cpfNormalized = data.cpf ? normalizeDigits(data.cpf) : null;

      if (!isValidCNS(susNormalized)) {
        return reply.status(422).send({ title: 'Cartão SUS inválido', status: 422 });
      }
      if (cpfNormalized && !isValidCPF(cpfNormalized)) {
        return reply.status(422).send({ title: 'CPF inválido', status: 422 });
      }

      const duplicate = await prisma.donor.findFirst({
        where: {
          id: { not: id },
          OR: [
            { susNormalized },
            ...(cpfNormalized ? [{ cpfNormalized }] : []),
          ],
        },
      });
      if (duplicate) {
        return reply.status(409).send({
          title: 'Cadastro duplicado',
          status: 409,
          detail: `Documento já vinculado à doadora ${duplicate.code}.`,
        });
      }

      const verdict = evaluateGoNoGo(data);
      let statusCadastro = data.statusCadastro || oldDonor.statusCadastro;
      if (verdict.aptidao === 'Inapta') statusCadastro = 'inativa';

      const hasExplicitCoords = typeof data.lat === 'number' && typeof data.lng === 'number';
      const addressChanged =
        oldDonor.zona !== data.zona || oldDonor.endereco.trim() !== data.endereco.trim();
      const [lat, lng] = hasExplicitCoords
        ? [data.lat!, data.lng!]
        : addressChanged
        ? zoneFallbackCoords(data.zona)
        : [oldDonor.lat, oldDonor.lng];
      const geocodeStatus = hasExplicitCoords
        ? data.geocodeStatus || 'verified'
        : addressChanged
        ? 'approximate'
        : oldDonor.geocodeStatus;

      const updated = await prisma.donor.update({
        where: { id },
        data: {
          nome: data.nome,
          bebe: data.bebe,
          sus: data.sus,
          susNormalized,
          cpf: data.cpf || 'Não informado',
          cpfNormalized,
          nascimento: data.nascimento,
          parto: data.parto,
          telefone: data.telefone,
          endereco: data.endereco,
          bairro: extractNeighborhood(data.endereco),
          zona: data.zona,
          lat,
          lng,
          geocodeStatus,
          vacinaFebre: data.vacinaFebre,
          vacinaDtpa: data.vacinaDtpa,
          transfusao: data.transfusaoData ? data.transfusaoData : data.transfusao || 'Não',
          transfusaoData: data.transfusaoData || null,
          tatuagem: data.tatuagemData ? data.tatuagemData : data.tatuagem || 'Não',
          tatuagemData: data.tatuagemData || null,
          fumo: data.fumo,
          alcool: data.alcool,
          medicacao: data.medicacao || 'Nenhuma',
          aguaPotavel: data.aguaPotavel,
          redeEsgoto: data.redeEsgoto,
          renda: data.renda || null,
          pesoBebe: data.pesoBebe || null,
          apgar: data.apgar || null,
          malformacao: data.malformacao,
          intercorrencias: JSON.stringify(data.intercorrencias),
          equipamento: data.equipamento,
          extracao: data.extracao,
          produtosJunto: data.produtosJunto,
          soro1Data: data.soro1Data || null,
          sorologia1: data.soro1Res,
          soro2Data: data.soro2Data || null,
          sorologia2: data.soro2Res,
          soro3Data: data.soro3Data || null,
          sorologia3: data.soro3Res,
          aptidao: verdict.aptidao,
          statusCadastro,
          motivoInapta: verdict.approved ? null : verdict.reasons.join(' · '),
        },
      });

      await recordAudit({
        request,
        action: 'DONOR_UPDATED',
        entity: 'Donor',
        entityId: updated.id,
        details: {
          previousAptidao: oldDonor.aptidao,
          newAptidao: updated.aptidao,
          statusCadastro: updated.statusCadastro,
        },
      });

      return reply.send({
        donor: serializeDonorForRole(updated, request.user.role),
        verdict,
      });
    }
  );

  // Soft delete / reativação
  app.patch(
    '/donors/:id/status',
    {
      preHandler: [requireRoles('ADMIN', 'COORDENADOR_BLH')],
      schema: { tags: ['Doadoras'], summary: 'Inativar ou reativar cadastro de doadora' },
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      const parsed = statusPatchSchema.safeParse(request.body);
      if (isNaN(id) || !parsed.success) {
        return reply.status(400).send({ title: 'Parâmetros inválidos', status: 400 });
      }

      const donor = await prisma.donor.findUnique({ where: { id } });
      if (!donor) {
        return reply.status(404).send({ title: 'Doadora não encontrada', status: 404 });
      }

      const updated = await prisma.donor.update({
        where: { id },
        data: { statusCadastro: parsed.data.statusCadastro },
      });

      await recordAudit({
        request,
        action: parsed.data.statusCadastro === 'inativa' ? 'DONOR_INACTIVATED' : 'DONOR_REACTIVATED',
        entity: 'Donor',
        entityId: updated.id,
      });

      return reply.send({ donor: serializeDonorForRole(updated, request.user.role) });
    }
  );
}
