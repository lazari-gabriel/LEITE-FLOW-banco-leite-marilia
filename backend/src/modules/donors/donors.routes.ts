import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireRoles } from '../../middlewares/auth.js';
import {
  evaluateGoNoGo,
  extractNeighborhood,
  isValidCNS,
  isValidCPF,
  normalizeDigits,
  serializeDonorForRole,
} from '../../lib/domain.js';
import { recordAudit } from '../../lib/audit.js';
import {
  createValidatedDonor,
  donorFormSchema,
  DonorValidationError,
  zoneFallbackCoords,
} from './donorCreation.service.js';

const statusPatchSchema = z.object({
  statusCadastro: z.enum(['ativa', 'inativa']),
});

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
        include: {
          interestOrigin: {
            select: { id: true, protocol: true },
          },
        },
        orderBy: { id: 'desc' },
      });
      return {
        data: donors.map((d) => ({
          ...serializeDonorForRole(d, request.user.role),
          ...(request.user.role !== 'COLETOR_CAMPO' && d.interestOrigin
            ? { interestOriginProtocol: d.interestOrigin.protocol }
            : {}),
        })),
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

      try {
        const { created, verdict } = await prisma.$transaction((tx) =>
          createValidatedDonor(tx, parsed.data)
        );

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
      } catch (err) {
        if (err instanceof DonorValidationError) {
          return reply.status(err.status).send({
            type: 'about:blank',
            title: err.title,
            status: err.status,
            detail: err.message,
          });
        }
        throw err;
      }
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
