import { useQuery } from '@tanstack/react-query';
import { listTraderReviews, type TraderReviewDto, type ListResponse } from '@/services/traderReviewService';

export function useTraderReviews(
  traderId: string | undefined,
  page?: number,
): {
  reviews: TraderReviewDto[];
  total: number;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery<ListResponse<TraderReviewDto>>({
    queryKey: ['trader-reviews', traderId, page],
    queryFn: () => listTraderReviews(traderId!, page, 10),
    enabled: typeof traderId === 'string' && traderId.length > 0,
  });

  return {
    reviews: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
  };
}
