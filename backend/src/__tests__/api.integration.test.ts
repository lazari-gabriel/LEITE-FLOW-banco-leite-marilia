import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

let app: FastifyInstance;
let adminToken = '';
let coletorToken = '';
let labToken = '';
let createdDonorId = 0;
let createdRouteId = '';
let createdBottleId = 0;

const TEST_SUS = '898 0033 7788 9908';
const TEST_CPF = '529.982.247-25';

describe('LEITE FLOW Backend — Integração API, Auth, RBAC e Cadeia de Custódia (M003/M004)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await buildApp();
    await app.ready();

    // Limpa eventuais restos de execuções anteriores deste teste (respeitando FKs)
    await prisma.bottle.deleteMany({ where: { donor: { susNormalized: '898003377889908' } } });
    await prisma.collectionVisit.deleteMany({ where: { donor: { susNormalized: '898003377889908' } } });
    await prisma.route.deleteMany({ where: { name: { contains: '[TESTE-INT]' } } });
    await prisma.donor.deleteMany({ where: { susNormalized: '898003377889908' } });
  });

  afterAll(async () => {
    await prisma.bottle.deleteMany({ where: { donor: { susNormalized: '898003377889908' } } });
    await prisma.collectionVisit.deleteMany({ where: { donor: { susNormalized: '898003377889908' } } });
    await prisma.route.deleteMany({ where: { name: { contains: '[TESTE-INT]' } } });
    await prisma.donor.deleteMany({ where: { susNormalized: '898003377889908' } });
    await app.close();
  });

  it('GET /health retorna 200 ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('bloqueia acesso não autenticado (401) a endpoints protegidos', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/donors' });
    expect(res.statusCode).toBe(401);
  });

  it('autentica ADMIN, COLETOR_CAMPO e LABORATORIO com JWT + refresh cookie HttpOnly', async () => {
    const loginAdmin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@leiteflow.org', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@2026' },
    });
    expect(loginAdmin.statusCode).toBe(200);
    adminToken = loginAdmin.json().accessToken;
    expect(loginAdmin.headers['set-cookie']).toBeDefined();

    const loginColetor = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'coletor@leiteflow.org', password: process.env.SEED_COLETOR_PASSWORD || 'Coleta@2026' },
    });
    expect(loginColetor.statusCode).toBe(200);
    coletorToken = loginColetor.json().accessToken;

    const loginLab = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'laboratorio@leiteflow.org', password: process.env.SEED_LAB_PASSWORD || 'Lab@2026' },
    });
    expect(loginLab.statusCode).toBe(200);
    labToken = loginLab.json().accessToken;
  });

  it('RBAC: COLETOR_CAMPO recebe 403 ao tentar cadastrar doadora ou consultar auditoria', async () => {
    const postDonor = await app.inject({
      method: 'POST',
      url: '/api/v1/donors',
      headers: { authorization: `Bearer ${coletorToken}` },
      payload: { nome: 'Teste' },
    });
    expect(postDonor.statusCode).toBe(403);

    const getAudit = await app.inject({
      method: 'GET',
      url: '/api/v1/audit-logs',
      headers: { authorization: `Bearer ${coletorToken}` },
    });
    expect(getAudit.statusCode).toBe(403);
  });

  it('cadastra doadora pendente, bloqueia duplicidade (409) e aprova ao atualizar sorologia para normal', async () => {
    const payload = {
      nome: 'Juliana Teste Integração',
      bebe: 'Arthur Teste',
      sus: TEST_SUS,
      cpf: TEST_CPF,
      nascimento: '1995-04-10',
      parto: '2026-11-10',
      telefone: '(14) 99888-7766',
      zona: 'Norte',
      endereco: 'Rua Tomé de Souza, 120 — Palmital, Marília - SP',
      soro1Res: 'pendente',
      soro2Res: 'pendente',
      soro3Res: 'pendente',
    };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/donors',
      headers: { authorization: `Bearer ${adminToken}` },
      payload,
    });
    expect(createRes.statusCode).toBe(201);
    const body = createRes.json();
    expect(body.donor.aptidao).toBe('Pendente');
    createdDonorId = body.donor.id;

    // Duplicidade bloqueada
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/donors',
      headers: { authorization: `Bearer ${adminToken}` },
      payload,
    });
    expect(dupRes.statusCode).toBe(409);

    // LGPD: COLETOR_CAMPO não recebe CPF nem Cartão SUS
    const coletorList = await app.inject({
      method: 'GET',
      url: '/api/v1/donors',
      headers: { authorization: `Bearer ${coletorToken}` },
    });
    const visibleToColetor = coletorList.json().data.find((d: { id: number }) => d.id === createdDonorId);
    expect(visibleToColetor.cpf).toBe('PROTEGIDO (LGPD)');
    expect(visibleToColetor.sus).toBe('PROTEGIDO (LGPD)');

    // Atualizar pendente -> normal APROVA a doadora
    const approveRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/donors/${createdDonorId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { ...payload, soro1Res: 'normal', soro2Res: 'normal', soro3Res: 'normal' },
    });
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.json().donor.aptidao).toBe('Apta');
    expect(approveRes.json().donor.statusCadastro).toBe('ativa');
  });

  it('executa fluxo completo: criar rota -> iniciar -> coletar frasco -> bloquear etiqueta UTI -> laudo lab -> liberar etiqueta UTI -> auditoria', async () => {
    // 1. Criar rota com a doadora
    const routeRes = await app.inject({
      method: 'POST',
      url: '/api/v1/routes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: '[TESTE-INT] Van 01 Norte',
        day: 'Segunda',
        zone: 'Norte',
        driverName: 'Carlos Alberto Silva',
        collectorName: 'Enfª Cláudia Guimarães',
        vehicleName: 'Van 01 - Sprinter',
        vehiclePlate: 'BRA-2E19',
        shift: 'Manhã',
        donorIds: [createdDonorId],
      },
    });
    expect(routeRes.statusCode).toBe(201);
    createdRouteId = routeRes.json().route.id;

    // 2. Iniciar rota
    const startRes = await app.inject({
      method: 'POST',
      url: `/api/v1/routes/${createdRouteId}/start`,
      headers: { authorization: `Bearer ${coletorToken}` },
    });
    expect(startRes.statusCode).toBe(200);
    expect(startRes.json().route.status).toBe('active');

    // 3. Registrar coleta (frasco sem laudo mockado!)
    const bottleRes = await app.inject({
      method: 'POST',
      url: '/api/v1/bottles',
      headers: { authorization: `Bearer ${coletorToken}` },
      payload: {
        doadoraId: createdDonorId,
        routeId: createdRouteId,
        volume: 200,
        temp: -16.8,
        classe: 'T',
        frascosEntregues: 3,
        observacao: 'Coleta teste integração',
      },
    });
    expect(bottleRes.statusCode).toBe(201);
    const bottle = bottleRes.json().bottle;
    expect(bottle.acidez).toBeNull();
    expect(bottle.crematocrito).toBeNull();
    createdBottleId = bottle.id;

    // 4. Tentativa de imprimir Etiqueta 3 (UTI) para frasco cru é BLOQUEADA (422)
    const blockedLabel = await app.inject({
      method: 'POST',
      url: `/api/v1/bottles/${createdBottleId}/labels`,
      headers: { authorization: `Bearer ${labToken}` },
      payload: { labelType: 'pasteurizacao', format: '60x40mm' },
    });
    expect(blockedLabel.statusCode).toBe(422);

    // 5. Laboratório registra análise e libera pasteurização
    const labRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/bottles/${createdBottleId}/lab`,
      headers: { authorization: `Bearer ${labToken}` },
      payload: {
        acidezDornicNum: 4.0,
        crematocritoKcal: 680,
        microbiologyPassed: true,
        statusPast: 'Pasteurizado',
      },
    });
    expect(labRes.statusCode).toBe(200);
    expect(labRes.json().bottle.statusPast).toBe('Pasteurizado');

    // 6. Agora Etiqueta 3 (UTI) é liberada (1ª via) e 2ª via exige motivo
    const okLabel = await app.inject({
      method: 'POST',
      url: `/api/v1/bottles/${createdBottleId}/labels`,
      headers: { authorization: `Bearer ${labToken}` },
      payload: { labelType: 'pasteurizacao', format: '60x40mm' },
    });
    expect(okLabel.statusCode).toBe(201);
    const firstPrintId = okLabel.json().printLog.id;
    expect(okLabel.json().printLog.copyNumber).toBe(1);

    const reprintNoReason = await app.inject({
      method: 'POST',
      url: `/api/v1/bottles/${createdBottleId}/labels`,
      headers: { authorization: `Bearer ${labToken}` },
      payload: { labelType: 'pasteurizacao', format: '60x40mm' },
    });
    expect(reprintNoReason.statusCode).toBe(422);

    // 6b. Histórico de etiquetas e anulação controlada (PATCH /labels/:printId/void)
    const historyRes = await app.inject({
      method: 'GET',
      url: `/api/v1/bottles/${createdBottleId}/labels`,
      headers: { authorization: `Bearer ${labToken}` },
    });
    expect(historyRes.statusCode).toBe(200);
    expect(historyRes.json().data).toHaveLength(1);

    const voidRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/labels/${firstPrintId}/void`,
      headers: { authorization: `Bearer ${labToken}` },
      payload: { voidReason: 'Impressão teste anulada' },
    });
    expect(voidRes.statusCode).toBe(200);
    expect(voidRes.json().printLog.status).toBe('voided');

    // 6c. Dispensação UTI Neonatal (somente frasco Pasteurizado)
    const dispenseRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/bottles/${createdBottleId}/dispense`,
      headers: { authorization: `Bearer ${labToken}` },
      payload: { destinoUTI: 'UTI Neonatal · Leito 02' },
    });
    expect(dispenseRes.statusCode).toBe(200);
    expect(dispenseRes.json().bottle.statusPast).toBe('Dispensado');

    // 7. Auditoria gravou operações
    const auditRes = await app.inject({
      method: 'GET',
      url: '/api/v1/audit-logs',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(auditRes.statusCode).toBe(200);
    expect(auditRes.json().data.length).toBeGreaterThan(0);
  });

  it('suporta coleta multi-frasco (batch), rejeita acidez > 8°D, otimiza rota 2-opt e retorna dashboard real', async () => {
    // Coleta multi-frasco atômica (2 frascos com data de 1ª ordenha)
    const batchRes = await app.inject({
      method: 'POST',
      url: '/api/v1/bottles/batch',
      headers: { authorization: `Bearer ${coletorToken}` },
      payload: {
        doadoraId: createdDonorId,
        routeId: createdRouteId,
        frascosEntregues: 2,
        observacao: 'Lote de 2 frascos congelados',
        items: [
          { volume: 150, temp: -17.0, classe: 'T', firstExpressionAt: '2026-11-15' },
          { volume: 180, temp: -16.5, classe: 'T', firstExpressionAt: '2026-11-16' },
        ],
      },
    });
    expect(batchRes.statusCode).toBe(201);
    const batchBottles = batchRes.json().bottles;
    expect(batchBottles).toHaveLength(2);
    expect(batchBottles[0].codigo).not.toBe(batchBottles[1].codigo);

    // Acidez > 8.0 °D impede pasteurização (422 RDC 171)
    const badLab = await app.inject({
      method: 'PATCH',
      url: `/api/v1/bottles/${batchBottles[0].id}/lab`,
      headers: { authorization: `Bearer ${labToken}` },
      payload: {
        acidezDornicNum: 9.5,
        crematocritoKcal: 620,
        microbiologyPassed: true,
        statusPast: 'Pasteurizado',
      },
    });
    expect(badLab.statusCode).toBe(422);

    // Rota em planejamento + otimização 2-opt no servidor
    const planRoute = await app.inject({
      method: 'POST',
      url: '/api/v1/routes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: '[TESTE-INT] Rota 2-opt',
        day: 'Terça',
        zone: 'Sul',
        driverName: 'Marcos Pereira',
        vehicleName: 'Fiorino 02',
        donorIds: [createdDonorId],
      },
    });
    expect(planRoute.statusCode).toBe(201);

    const optRes = await app.inject({
      method: 'POST',
      url: `/api/v1/routes/${planRoute.json().route.id}/optimize`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(optRes.statusCode).toBe(200);

    // Dashboard Summary retorna agregações reais
    const summaryRes = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard/summary',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.json().stats.totalBottles).toBeGreaterThanOrEqual(3);
  });
});
