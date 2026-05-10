import { useQuery } from '@tanstack/react-query';
import { getTrustScore, type TrustScoreDto } from '@/services/traderReviewService';

export function useTrustScore(traderId: string | undefined): {
  trustScore: TrustScoreDto | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery<TrustScoreDto>({
    queryKey: ['trust-score', traderId],
    queryFn: () => getTrustScore(traderId!),
    enabled: typeof traderId === 'string' && traderId.length > 0,
    staleTime: 60_000,
  });

  return { trustScore: data, isLoading };
}
