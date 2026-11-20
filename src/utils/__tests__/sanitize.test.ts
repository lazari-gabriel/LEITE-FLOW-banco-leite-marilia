import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../sanitize';

describe('sanitize / escapeHtml (M001 XSS Hardening)', () => {
  it('escapa tags HTML e atributos perigosos em payload XSS', () => {
    const payload = '<img src=x onerror="alert(1)"> & \'script\'';
    const safe = escapeHtml(payload);

    expect(safe).not.toContain('<img');
    expect(safe).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;script&#39;');
  });

  it('retorna string vazia para null ou undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
