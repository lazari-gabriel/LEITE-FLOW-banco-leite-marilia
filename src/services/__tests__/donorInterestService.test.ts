import { describe, it, expect } from 'vitest';
import {
  buildInterestWhatsAppUrl,
  formatCepInput,
  formatPhoneInput,
  validatePublicInterestForm,
} from '../donorInterestService';
import { DonorInterestPublicPayload } from '../../types/donorInterest';

const VALID_PAYLOAD: DonorInterestPublicPayload = {
  fullName: 'Camila Andrade Souza',
  birthDate: '1996-05-12',
  city: 'Marília',
  neighborhood: 'Jardim Esmeralda',
  cep: '17516-000',
  suggestedZone: 'Leste',
  phone: '(14) 99812-3456',
  isWhatsappSame: true,
  email: 'camila@exemplo.com',
  preferredContact: 'WHATSAPP',
  bestContactTime: 'MANHA',
  donatedBefore: false,
  knowsProcess: 'PARCIALMENTE',
  hasQuestions: true,
  questionsText: 'Como recebo os frascos esterilizados?',
  discoveryChannel: 'SITE',
  consentAccepted: true,
};

describe('donorInterestService — Máscaras, Validação LGPD e WhatsApp', () => {
  it('formata telefone e CEP corretamente', () => {
    expect(formatPhoneInput('14998123456')).toBe('(14) 99812-3456');
    expect(formatPhoneInput('1434138696')).toBe('(14) 3413-8696');
    expect(formatCepInput('17516000')).toBe('17516-000');
  });

  it('aceita payload público completo e válido', () => {
    const errors = validatePublicInterestForm(VALID_PAYLOAD);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('rejeita nome sem sobrenome, telefone inválido, CEP incompleto e ausência de consentimento LGPD', () => {
    const errors = validatePublicInterestForm({
      ...VALID_PAYLOAD,
      fullName: 'Camila',
      phone: '14999',
      cep: '1751',
      consentAccepted: false,
    });
    expect(errors.fullName).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.cep).toBeDefined();
    expect(errors.consentAccepted).toBeDefined();
  });

  it('exige e-mail quando preferência de contato for EMAIL', () => {
    const errors = validatePublicInterestForm({
      ...VALID_PAYLOAD,
      preferredContact: 'EMAIL',
      email: '',
    });
    expect(errors.email).toBeDefined();
  });

  it('gera link WhatsApp com protocolo e prefixo brasileiro 55', () => {
    const url = buildInterestWhatsAppUrl({
      fullName: 'Camila Andrade Souza',
      phone: '(14) 99812-3456',
      whatsapp: null,
      protocol: 'CAP-2026-000001',
    });
    expect(url).toContain('https://wa.me/5514998123456?text=');
    expect(decodeURIComponent(url)).toContain('Camila');
    expect(decodeURIComponent(url)).toContain('CAP-2026-000001');
  });
});
