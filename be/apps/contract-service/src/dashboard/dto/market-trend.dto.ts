// FR-T02: xu hướng nhu cầu thị trường cho trader.
// demand = tổng sản lượng buyer cần (buying_requests, 30 ngày, toàn thị trường).
// supply = tổng sản lượng trader đã hoàn tất giao (orders completed, 30 ngày).
// trend  = so sánh demand vs supply: 'up' khi cầu vượt cung, 'down' khi cung vượt cầu.
export interface MarketTrendDto {
  cropType: string;
  demand: number;
  supply: number;
  buyerCount: number;
  trend: 'up' | 'down' | 'stable';
}
