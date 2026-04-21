/**
 * Mock Marketplace Service — Phase 9.1 (FR-T03, FR-U01, FR-G03)
 *
 * Giả lập tầng transport cho Product/Marketplace endpoints — dùng khi BE chưa triển khai.
 * JSON khớp 1-1 với hợp đồng ProductDto trong
 * specs/backend-api-specification/design.md §4.4.1.
 *
 * Endpoints giả lập:
 *   GET    /api/v1/products                → ListResponse<ProductDto>
 *   GET    /api/v1/products/:id            → ProductDto
 *   POST   /api/v1/products (trader)       → ProductDto
 *   PUT    /api/v1/products/:id (trader)   → ProductDto
 *   DELETE /api/v1/products/:id (trader)   → { success: true }
 */

import { withMockDelay } from './index';

// ── DTOs (camelCase, khớp hợp đồng backend) ──────────────────────────────────

export interface ProductDto {
  id: string;
  traderId: string;
  farmId?: string;
  name: string;
  cropType: string;
  unit: string;           // "kg"
  price: number;
  currency: 'VND';
  images: string[];       // URL thực tế; mock dùng emoji placeholder
  standardCode?: string;  // "VIETGAP_2024" | "GLOBALGAP_2024" | "ORGANIC_2024"
  stockQuantity?: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListProductsParams {
  cropType?: string;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  traderId?: string;
  status?: 'active' | 'inactive' | 'all';
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  farmId?: string;
  name: string;
  cropType: string;
  unit: string;
  price: number;
  images?: string[];
  standardCode?: string;
  stockQuantity?: number;
  description?: string;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  stockQuantity?: number;
  description?: string;
  status?: 'active' | 'inactive';
  images?: string[];
  standardCode?: string;
}

// ── Mock data store (có thể mutate khi create/update/delete) ─────────────────

let MOCK_PRODUCTS: ProductDto[] = [
  {
    id: 'prod-001',
    traderId: 'trader-001',
    farmId: 'farm-001',
    name: 'Sầu riêng Monthong',
    cropType: 'durian',
    unit: 'kg',
    price: 120000,
    currency: 'VND',
    images: ['🌳'],
    standardCode: 'GLOBALGAP_2024',
    stockQuantity: 500,
    description:
      'Sầu riêng Monthong chất lượng cao, vị ngọt đậm đà, múi dày, hạt lép. Trồng theo quy trình GlobalGAP, đảm bảo an toàn thực phẩm. Nguồn gốc Cái Bè, Tiền Giang.',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-002',
    traderId: 'trader-001',
    farmId: 'farm-002',
    name: 'Bưởi Da Xanh',
    cropType: 'pomelo',
    unit: 'kg',
    price: 45000,
    currency: 'VND',
    images: ['🍊'],
    standardCode: 'VIETGAP_2024',
    stockQuantity: 1000,
    description:
      'Bưởi Da Xanh Bến Tre đặc sản, vỏ xanh mướt, múi hồng đỏ, vị ngọt thanh. Đạt chuẩn VietGAP. Thu hoạch tháng 10-12.',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-003',
    traderId: 'trader-002',
    farmId: 'farm-003',
    name: 'Xoài Cát Chu',
    cropType: 'mango',
    unit: 'kg',
    price: 35000,
    currency: 'VND',
    images: ['🥭'],
    standardCode: 'VIETGAP_2024',
    stockQuantity: 800,
    description:
      'Xoài Cát Chu Đồng Tháp, kích thước đều, vị ngọt thanh, độ ngọt ≥14 Brix. VietGAP đảm bảo không dư lượng thuốc.',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-004',
    traderId: 'trader-001',
    farmId: 'farm-006',
    name: 'Thanh Long Ruột Đỏ',
    cropType: 'dragon_fruit',
    unit: 'kg',
    price: 28000,
    currency: 'VND',
    images: ['🐉'],
    standardCode: 'ORGANIC_2024',
    stockQuantity: 0,
    description:
      'Thanh long ruột đỏ Long An, màu sắc bắt mắt, vị ngọt nhẹ. Canh tác hữu cơ 100%, không hóa chất.',
    status: 'inactive',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-005',
    traderId: 'trader-002',
    farmId: 'farm-004',
    name: 'Cam Sành Hà Giang',
    cropType: 'orange',
    unit: 'kg',
    price: 32000,
    currency: 'VND',
    images: ['🍊'],
    standardCode: 'VIETGAP_2024',
    stockQuantity: 600,
    description:
      'Cam Sành Hà Giang đặc sản vùng núi, vỏ sần sùi, múi căng mọng, vị ngọt chua cân bằng. Thu hoạch tháng 11 - 2.',
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-006',
    traderId: 'trader-001',
    farmId: 'farm-005',
    name: 'Nhãn Lồng Hưng Yên',
    cropType: 'longan',
    unit: 'kg',
    price: 55000,
    currency: 'VND',
    images: ['🍇'],
    standardCode: 'GLOBALGAP_2024',
    stockQuantity: 300,
    description:
      'Nhãn lồng Hưng Yên đặc sản nổi tiếng, hạt nhỏ, cùi dày trắng trong, vị ngọt đậm thơm. GlobalGAP xuất khẩu.',
    status: 'active',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-007',
    traderId: 'trader-002',
    name: 'Vải Thiều Lục Ngạn',
    cropType: 'lychee',
    unit: 'kg',
    price: 48000,
    currency: 'VND',
    images: ['🍒'],
    standardCode: 'VIETGAP_2024',
    stockQuantity: 200,
    description:
      'Vải thiều Lục Ngạn Bắc Giang, vỏ đỏ hồng, cùi trắng trong, vị ngọt đậm thơm. Mùa vụ tháng 5-7.',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'prod-008',
    traderId: 'trader-002',
    name: 'Chuối Cavendish',
    cropType: 'banana',
    unit: 'kg',
    price: 18000,
    currency: 'VND',
    images: ['🍌'],
    stockQuantity: 2000,
    description:
      'Chuối Cavendish Đồng Nai, buồng đẹp đều, vị ngọt nhẹ béo mịn. Đóng gói xuất khẩu, thu hoạch quanh năm.',
    status: 'active',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Helper constants ──────────────────────────────────────────────────────────

export const CROP_LABELS: Record<string, string> = {
  dragon_fruit: 'Thanh long',
  pomelo: 'Bưởi',
  mango: 'Xoài',
  orange: 'Cam',
  longan: 'Nhãn',
  durian: 'Sầu riêng',
  lychee: 'Vải',
  banana: 'Chuối',
  rambutan: 'Chôm chôm',
};

export const STANDARD_LABELS: Record<string, string> = {
  VIETGAP_2024: 'VietGAP',
  GLOBALGAP_2024: 'GlobalGAP',
  ORGANIC_2024: 'Hữu cơ',
};

export function cropLabel(cropType: string): string {
  return CROP_LABELS[cropType] ?? cropType;
}

export function standardLabel(code?: string): string | undefined {
  if (!code) return undefined;
  return STANDARD_LABELS[code] ?? code;
}

/** Emoji thumbnail dựa theo cropType */
export function cropEmoji(cropType: string): string {
  const map: Record<string, string> = {
    dragon_fruit: '🐉',
    pomelo: '🍊',
    mango: '🥭',
    orange: '🍊',
    longan: '🍇',
    durian: '🌳',
    lychee: '🍒',
    banana: '🍌',
    rambutan: '🍈',
  };
  return map[cropType] ?? '🌾';
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Giả lập GET /api/v1/products
 * Public — không yêu cầu auth. Lọc theo cropType, region, priceMin, priceMax, traderId, status.
 */
export async function listProducts(
  params?: ListProductsParams,
): Promise<ListResponse<ProductDto>> {
  let results = [...MOCK_PRODUCTS];

  // Lọc status mặc định chỉ active (trừ khi trader xem kho của mình)
  const statusFilter = params?.status ?? 'active';
  if (statusFilter !== 'all') {
    results = results.filter((p) => p.status === statusFilter);
  }

  if (params?.traderId) {
    results = results.filter((p) => p.traderId === params.traderId);
  }

  if (params?.cropType && params.cropType !== 'all') {
    results = results.filter((p) => p.cropType === params.cropType);
  }

  if (params?.priceMin !== undefined) {
    results = results.filter((p) => p.price >= params.priceMin!);
  }

  if (params?.priceMax !== undefined) {
    results = results.filter((p) => p.price <= params.priceMax!);
  }

  const kw = params?.keyword?.toLowerCase();
  if (kw) {
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        cropLabel(p.cropType).toLowerCase().includes(kw) ||
        p.description?.toLowerCase().includes(kw),
    );
  }

  results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const items = results.slice((page - 1) * limit, page * limit);

  return withMockDelay({ items, page, limit, total: results.length });
}

/**
 * Giả lập GET /api/v1/products/:id
 * Public — trả về chi tiết sản phẩm kèm tham chiếu vườn.
 */
export async function getProduct(id: string): Promise<ProductDto> {
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) {
    return withMockDelay<ProductDto>(
      () => { throw new Error('Sản phẩm không tồn tại.'); },
    );
  }
  return withMockDelay({ ...product });
}

/**
 * Giả lập POST /api/v1/products (trader only)
 * Tạo mặt hàng mới.
 */
export async function createProduct(
  traderId: string,
  body: CreateProductDto,
): Promise<ProductDto> {
  const newProduct: ProductDto = {
    id: `prod-${Date.now()}`,
    traderId,
    farmId: body.farmId,
    name: body.name,
    cropType: body.cropType,
    unit: body.unit,
    price: body.price,
    currency: 'VND',
    images: body.images ?? [cropEmoji(body.cropType)],
    standardCode: body.standardCode,
    stockQuantity: body.stockQuantity,
    description: body.description,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  MOCK_PRODUCTS = [newProduct, ...MOCK_PRODUCTS];
  return withMockDelay({ ...newProduct });
}

/**
 * Giả lập PUT /api/v1/products/:id (trader only)
 * Cập nhật thông tin mặt hàng.
 */
export async function updateProduct(
  id: string,
  body: UpdateProductDto,
): Promise<ProductDto> {
  const index = MOCK_PRODUCTS.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Sản phẩm không tồn tại.');
  MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...body };
  return withMockDelay({ ...MOCK_PRODUCTS[index] });
}

/**
 * Giả lập DELETE /api/v1/products/:id (trader only)
 * Soft delete — chuyển status sang 'inactive'.
 */
export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) throw new Error('Sản phẩm không tồn tại.');
  product.status = 'inactive';
  return withMockDelay({ success: true });
}
