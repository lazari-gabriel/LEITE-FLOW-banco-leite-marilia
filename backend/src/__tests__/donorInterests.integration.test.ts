import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

let app: FastifyInstance;
let adminToken = '';
let coordToken = '';
let coletorToken = '';
let labToken = '';

const TEST_PHONE_1 = '(14) 99123-7788';
const TEST_PHONE_1_NORM = '14991237788';
const TEST_PHONE_2 = '(14) 99123-7799';
const TEST_PHONE_2_NORM = '14991237799';
const TEST_SUS = '898 0044 5566 7703'; // Mod 11 valid? Let's verify in helper below

function generateValidCnsForTest(): string {
  for (let n = 1000000000000; n < 1000000000200; n++) {
    const first14 = `8${String(n).padStart(13, '0')}`;
    let sum = 0;
    for (let i = 0; i < 14; i++) sum += Number(first14[i]) * (15 - i);
    const d15 = (11 - (sum % 11)) % 11;
    if (d15 === 10) continue;
    const raw = `${first14}${d15}`;
    return `${raw.slice(0, 3)} ${raw.slice(3, 7)} ${raw.slice(7, 11)} ${raw.slice(11, 15)}`;
  }
  return TEST_SUS;
}

const VALID_CNS = generateValidCnsForTest();
const VALID_CNS_NORM = VALID_CNS.replace(/\D/g, '');

const createdInterestIds: string[] = [];

describe('LEITFLOW — Captação Digital de Novas Doadoras (Público, RBAC, LGPD e Conversão)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await buildApp();
    await app.ready();

    await prisma.donorInterest.deleteMany({
      where: { phoneNormalized: { in: [TEST_PHONE_1_NORM, TEST_PHONE_2_NORM] } },
    });
    await prisma.donor.deleteMany({
      where: { susNormalized: VALID_CNS_NORM },
    });

    const login = async (email: string, password: string) => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email, password },
      });
      expect(res.statusCode).toBe(200);
      return res.json().accessToken as string;
    };

    adminToken = await login('admin@leiteflow.org', process.env.SEED_ADMIN_PASSWORD || 'Admin@2026');
    coordToken = await login(
      'coordenacao@leiteflow.org',
      process.env.SEED_COORD_PASSWORD || 'Coord@2026'
    );
    coletorToken = await login(
      'coletor@leiteflow.org',
      process.env.SEED_COLETOR_PASSWORD || 'Coleta@2026'
    );
    labToken = await login(
      'laboratorio@leiteflow.org',
      process.env.SEED_LAB_PASSWORD || 'Lab@2026'
    );
  });

  afterAll(async () => {
    await prisma.donorInterest.deleteMany({
      where: {
        OR: [
          { id: { in: createdInterestIds } },
          { phoneNormalized: { in: [TEST_PHONE_1_NORM, TEST_PHONE_2_NORM] } },
        ],
      },
    });
    await prisma.donor.deleteMany({
      where: { susNormalized: VALID_CNS_NORM },
    });
    await app.close();
  });

  it('rejeita envio público sem consentimento LGPD, com honeypot preenchido ou envio instantâneo de bot', async () => {
    const base = {
      fullName: 'Beatriz Teste Captação',
      city: 'Marília',
      neighborhood: 'Palmital',
      phone: TEST_PHONE_1,
      isWhatsappSame: true,
      preferredContact: 'WHATSAPP',
      bestContactTime: 'MANHA',
      donatedBefore: false,
      knowsProcess: 'NAO',
      hasQuestions: false,
      discoveryChannel: 'SITE',
      consentAccepted: true,
      elapsedMs: 5000,
    };

    const noConsent = await app.inject({
      method: 'POST',
      url: '/api/v1/public/donor-interests',
      remoteAddress: '10.0.0.10',
      payload: { ...base, consentAccepted: false },
    });
    expect(noConsent.statusCode).toBe(400);

    const honeypot = await app.inject({
      method: 'POST',
      url: '/api/v1/public/donor-interests',
      remoteAddress: '10.0.0.11',
      payload: { ...base, website: 'https://spam-bot.invalid' },
    });
    expect(honeypot.statusCode).toBe(400);

    const tooFast = await app.inject({
      method: 'POST',
      url: '/api/v1/public/donor-interests',
      remoteAddress: '10.0.0.12',
      payload: { ...base, elapsedMs: 300 },
    });
    expect(tooFast.statusCode).toBe(400);
  });

  it('registra solicitação pública com protocolo real, dedup silencioso anti-enumeração e NÃO cria Donor', async () => {
    const payload = {
      fullName: 'Beatriz Teste Captação',
      birthDate: '1997-08-15',
      city: 'Marília',
      neighborhood: 'Jardim Esmeralda',
      cep: '17516-000',
      suggestedZone: 'Leste',
      phone: TEST_PHONE_1,
      isWhatsappSame: true,
      email: 'beatriz.captacao@exemplo.com',
      preferredContact: 'WHATSAPP',
      bestContactTime: 'TARDE',
      donatedBefore: false,
      knowsProcess: 'PARCIALMENTE',
      hasQuestions: true,
      questionsText: 'Os frascos são gratuitos?',
      discoveryChannel: 'REDES_SOCIAIS',
      consentAccepted: true,
      elapsedMs: 6500,
    };

    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/public/donor-interests',
      remoteAddress: '10.0.0.20',
      payload,
    });
    expect(res1.statusCode).toBe(201);
    const body1 = res1.json();
    expect(body1.protocol).toMatch(/^CAP-\d{4}-\d{6}$/);

    // Não aprovou nem criou doadora na tabela oficial Donor
    const matchedDonor = await prisma.donor.findFirst({
      where: {
        OR: [{ nome: 'Beatriz Teste Captação' }, { telefone: TEST_PHONE_1 }],
      },
    });
    expect(matchedDonor).toBeNull();

    // Reenvio com mesmo telefone nos últimos 7 dias retorna protocolo existente sem duplicar
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/public/donor-interests',
      remoteAddress: '10.0.0.21',
      payload,
    });
    expect(res2.statusCode).toBe(201);
    expect(res2.json().protocol).toBe(body1.protocol);

    const stored = await prisma.donorInterest.findUnique({ where: { protocol: body1.protocol } });
    expect(stored).not.toBeNull();
    expect(stored!.status).toBe('NOVA');
    createdInterestIds.push(stored!.id);
  });

  it('RBAC: bloqueia acesso não autenticado (401) e perfis COLETOR_CAMPO / LABORATORIO (403)', async () => {
    const unauth = await app.inject({ method: 'GET', url: '/api/v1/donor-interests' });
    expect(unauth.statusCode).toBe(401);

    const coletorRes = await app.inject({
      method: 'GET',
      url: '/api/v1/donor-interests',
      headers: { authorization: `Bearer ${coletorToken}` },
    });
    expect(coletorRes.statusCode).toBe(403);

    const labRes = await app.inject({
      method: 'GET',
      url: '/api/v1/donor-interests/summary',
      headers: { authorization: `Bearer ${labToken}` },
    });
    expect(labRes.statusCode).toBe(403);

    // COORDENADOR_BLH pode listar e consultar resumo, mas não pode anonimizar (somente ADMIN)
    const coordSummary = await app.inject({
      method: 'GET',
      url: '/api/v1/donor-interests/summary',
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(coordSummary.statusCode).toBe(200);
    expect(coordSummary.json().summary.totalNew).toBeGreaterThanOrEqual(1);

    const coordAnon = await app.inject({
      method: 'POST',
      url: `/api/v1/donor-interests/${createdInterestIds[0]}/anonymize`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(coordAnon.statusCode).toBe(403);
  });

  it('executa atendimento completo: contato -> status -> conversão atômica -> bloqueio de dupla conversão', async () => {
    const interestId = createdInterestIds[0];

    // 1. Registrar tentativa de contato
    const contactRes = await app.inject({
      method: 'POST',
      url: `/api/v1/donor-interests/${interestId}/contacts`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        channel: 'WHATSAPP',
        outcome: 'ATENDEU',
        notes: 'Interessada confirmou interesse e enviará exames pré-natal.',
      },
    });
    expect(contactRes.statusCode).toBe(201);
    expect(contactRes.json().interest.contactAttemptsCount).toBe(1);
    expect(contactRes.json().interest.status).toBe('EM_CONTATO');

    // 2. Exige closureReason ao tentar mover para NAO_PROSSEGUIU sem motivo
    const badClose = await app.inject({
      method: 'PATCH',
      url: `/api/v1/donor-interests/${interestId}/status`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { status: 'NAO_PROSSEGUIU' },
    });
    expect(badClose.statusCode).toBe(400);

    // 3. Conversão atômica para Donor oficial (sorologias pendentes -> aptidao Pendente)
    const convertPayload = {
      nome: 'Beatriz Teste Captação',
      bebe: 'Miguel Teste',
      sus: VALID_CNS,
      cpf: '',
      nascimento: '1997-08-15',
      parto: '2026-11-05',
      telefone: TEST_PHONE_1,
      zona: 'Leste',
      endereco: 'Rua das Flores, 250 — Jardim Esmeralda, Marília - SP',
      soro1Res: 'pendente',
      soro2Res: 'pendente',
      soro3Res: 'pendente',
    };

    const convertRes = await app.inject({
      method: 'POST',
      url: `/api/v1/donor-interests/${interestId}/convert`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: convertPayload,
    });
    expect(convertRes.statusCode).toBe(201);
    const converted = convertRes.json();
    expect(converted.donor.aptidao).toBe('Pendente');
    expect(converted.interest.status).toBe('ENCAMINHADA_CADASTRO');
    expect(converted.interest.convertedDonorId).toBe(converted.donor.id);

    // 4. Dupla conversão bloqueada (409)
    const doubleConvert = await app.inject({
      method: 'POST',
      url: `/api/v1/donor-interests/${interestId}/convert`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: convertPayload,
    });
    expect(doubleConvert.statusCode).toBe(409);
  });

  it('detecta duplicidade pré-conversão e permite anonimização LGPD somente pelo ADMIN', async () => {
    // Nova solicitação com o mesmo nome da doadora recém-convertida
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/donor-interests',
      remoteAddress: '10.0.0.30',
      payload: {
        fullName: 'Beatriz Teste Captação',
        city: 'Marília',
        neighborhood: 'Jardim Esmeralda',
        phone: TEST_PHONE_2,
        isWhatsappSame: true,
        preferredContact: 'WHATSAPP',
        bestContactTime: 'MANHA',
        donatedBefore: true,
        knowsProcess: 'SIM',
        hasQuestions: false,
        discoveryChannel: 'SITE',
        consentAccepted: true,
        elapsedMs: 4000,
      },
    });
    expect(res.statusCode).toBe(201);
    const second = await prisma.donorInterest.findUniqueOrThrow({
      where: { protocol: res.json().protocol },
    });
    createdInterestIds.push(second.id);

    // Duplicate check detecta a doadora existente pelo nome
    const dupRes = await app.inject({
      method: 'GET',
      url: `/api/v1/donor-interests/${second.id}/duplicate-check`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(dupRes.statusCode).toBe(200);
    expect(dupRes.json().matches.length).toBeGreaterThanOrEqual(1);

    // Anonimização LGPD pelo ADMIN remove PII
    const anonRes = await app.inject({
      method: 'POST',
      url: `/api/v1/donor-interests/${second.id}/anonymize`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(anonRes.statusCode).toBe(200);
    expect(anonRes.json().interest.phone).toBe('ANONIMIZADO');
    expect(anonRes.json().interest.anonymizedAt).not.toBeNull();
  });

  it('aplica rate limit (429) na rota pública após 5 requisições do mesmo IP', async () => {
    const ip = '10.99.99.99';
    let lastStatus = 200;
    for (let i = 0; i < 6; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/api/v1/public/donor-interests',
        remoteAddress: ip,
        payload: { consentAccepted: false }, // 400 conta normalmente no rate limit por IP
      });
      lastStatus = r.statusCode;
    }
    expect(lastStatus).toBe(429);
  });
});
