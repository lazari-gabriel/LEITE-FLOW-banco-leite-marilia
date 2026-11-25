import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchDonorInterestsSummary } from '../services/donorInterestService';

export function useDonorInterestsSummary() {
  const { isAuthenticated, hasRole } = useAuth();
  const canAccess = isAuthenticated && hasRole('ADMIN', 'COORDENADOR_BLH');

  return useQuery({
    queryKey: ['donor-interests-summary'],
    queryFn: fetchDonorInterestsSummary,
    enabled: canAccess,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
