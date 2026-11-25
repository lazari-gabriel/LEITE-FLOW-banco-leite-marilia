import { describe, it, expect } from 'vitest';
import { getDefaultRouteForRole, canRoleAccessPath } from '../AuthContext';

describe('AuthContext — Roteamento e RBAC por perfil', () => {
  it('direciona cada perfil para sua rota operacional padrão', () => {
    expect(getDefaultRouteForRole('ADMIN')).toBe('/dashboard');
    expect(getDefaultRouteForRole('COORDENADOR_BLH')).toBe('/dashboard');
    expect(getDefaultRouteForRole('COLETOR_CAMPO')).toBe('/rotas');
    expect(getDefaultRouteForRole('LABORATORIO')).toBe('/laboratorio');
    expect(getDefaultRouteForRole(undefined)).toBe('/rotas');
  });

  it('restringe /doadoras apenas para ADMIN e COORDENADOR_BLH', () => {
    expect(canRoleAccessPath('ADMIN', '/doadoras')).toBe(true);
    expect(canRoleAccessPath('COORDENADOR_BLH', '/doadoras')).toBe(true);
    expect(canRoleAccessPath('COLETOR_CAMPO', '/doadoras')).toBe(false);
    expect(canRoleAccessPath('LABORATORIO', '/doadoras')).toBe(false);
  });

  it('permite rotas operacionais compartilhadas e rejeita rotas desconhecidas', () => {
    expect(canRoleAccessPath('COLETOR_CAMPO', '/rotas')).toBe(true);
    expect(canRoleAccessPath('LABORATORIO', '/laboratorio')).toBe(true);
    expect(canRoleAccessPath('ADMIN', '/etiquetas?tab=1')).toBe(true);
    expect(canRoleAccessPath('ADMIN', '/login')).toBe(false);
    expect(canRoleAccessPath('ADMIN', '/')).toBe(false);
    expect(canRoleAccessPath('ADMIN', '/rota-inexistente')).toBe(false);
  });
});
