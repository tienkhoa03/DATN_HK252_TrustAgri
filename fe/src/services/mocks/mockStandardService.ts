/**
 * Mock Standard Service — Phase 4.1 (FR-T10, FR-F06)
 *
 * Giả lập tầng transport cho Standards Service — dùng khi VITE_USE_MOCK=true.
 * Types import từ standardService.ts (nguồn sự thật duy nhất về hợp đồng DTO).
 *
 * Mỗi hàm trả Promise với độ trễ ~1 giây qua withMockDelay,
 * JSON khớp 1-1 với hợp đồng StandardDto / StandardStepDto / ListResponse<StandardDto>
 * trong specs/backend-api-specification/design.md §4.3.
 *
 * Seed data: VietGAP 2024, GlobalGAP (Thanh Long), Hữu Cơ (Organic).
 */

import { withMockDelay } from './index';
import type {
  StandardDto,
  StandardStepDto,
  ListResponse,
  ListStandardsParams,
  CreateStandardDto,
  UpdateStandardDto,
} from '@/services/standardService';

export type { StandardDto, StandardStepDto, ListResponse, ListStandardsParams, CreateStandardDto, UpdateStandardDto };

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_STANDARDS: StandardDto[] = [
  {
    id: 'std-vietgap-001',
    code: 'VIETGAP_2024',
    name: 'VietGAP 2024 — Thanh Long Ruột Đỏ',
    description:
      'Quy trình canh tác thanh long ruột đỏ theo tiêu chuẩn VietGAP phiên bản 2024. Áp dụng cho vùng Đồng bằng Sông Cửu Long, quản lý toàn bộ chu kỳ từ cắt cành đến thu hoạch.',
    ownerTraderId: undefined,
    steps: [
      {
        id: 'step-vg-01',
        order: 1,
        title: 'Cắt cành và vệ sinh vườn',
        description:
          'Cắt bỏ cành già, cành bệnh. Dọn sạch lá rụng, tàn dư thực vật để tránh lây lan sâu bệnh.',
        expectedDurationDays: 3,
        acceptanceCriteria:
          'Vườn sạch tàn dư; vết cắt phẳng, không dập nát; dụng cụ được khử trùng.',
      },
      {
        id: 'step-vg-02',
        order: 2,
        title: 'Bón phân hữu cơ lót',
        description:
          'Bón phân hữu cơ hoai mục (phân bò ủ hoặc phân trùn quế) vào gốc cây, liều lượng 5–10 kg/trụ.',
        expectedDurationDays: 2,
        acceptanceCriteria:
          'Phân phân bổ đều quanh tán cây; không bón trực tiếp vào thân; ghi nhận lô phân và ngày bón.',
      },
      {
        id: 'step-vg-03',
        order: 3,
        title: 'Tưới nước dưỡng ẩm',
        description:
          'Tưới nước đều 2 lần/ngày (sáng sớm và chiều mát) trong giai đoạn ra chồi mới, duy trì độ ẩm đất 60–70%.',
        expectedDurationDays: 14,
        acceptanceCriteria:
          'Độ ẩm đất đạt 60–70% (đo bằng thiết bị hoặc cảm quan); không để úng gốc.',
      },
      {
        id: 'step-vg-04',
        order: 4,
        title: 'Thắp đèn kích hoa',
        description:
          'Thắp đèn LED trắng (≥ 400 lux) liên tục 8–10 giờ/đêm trong 15–20 ngày để kích thích ra hoa trái vụ.',
        expectedDurationDays: 20,
        acceptanceCriteria:
          'Tỷ lệ cành ra nụ ≥ 80% sau chu kỳ thắp đèn; ghi nhật ký ngày bật/tắt và số giờ.',
      },
      {
        id: 'step-vg-05',
        order: 5,
        title: 'Bảo vệ và thụ phấn',
        description:
          'Theo dõi sâu đục nụ (Batocera rufomaculata), phun thuốc BVTV được phép theo danh mục VietGAP. Hỗ trợ thụ phấn nhân tạo buổi tối khi cần.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Không phát hiện sâu đục nụ trên 5% tổng nụ; ghi chép tên thuốc, nồng độ, ngày phun theo biểu mẫu VietGAP.',
      },
      {
        id: 'step-vg-06',
        order: 6,
        title: 'Thu hoạch',
        description:
          'Thu hoạch quả đạt 28–30 ngày sau khi đậu trái (màu đỏ đồng đều ≥ 90% bề mặt). Hái bằng kéo sắc, không vặn xoắn.',
        expectedDurationDays: 5,
        acceptanceCriteria:
          'Quả đạt màu đỏ ≥ 90%; không có vết nứt, dập; cân nặng trung bình ≥ 400 g/quả; ghi số lô thu hoạch.',
      },
    ],
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 'std-globalgap-001',
    code: 'GLOBALGAP_V5_MANGO',
    name: 'GlobalGAP v5 — Xoài Cát Chu Đồng Tháp',
    description:
      'Quy trình canh tác xoài Cát Chu theo chứng nhận GlobalGAP phiên bản 5.0. Tập trung kiểm soát dư lượng thuốc bảo vệ thực vật, truy xuất nguồn gốc và quản lý môi trường.',
    ownerTraderId: 'user-trader-001',
    steps: [
      {
        id: 'step-gg-01',
        order: 1,
        title: 'Đánh giá rủi ro vùng trồng',
        description:
          'Lấy mẫu đất và nước tưới phân tích kim loại nặng, vi sinh vật gây hại. Lập bản đồ rủi ro ô nhiễm xung quanh vùng trồng.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Kết quả phân tích đạt ngưỡng GlobalGAP; hồ sơ lưu ít nhất 2 năm; không có nguồn ô nhiễm trong bán kính 500 m.',
      },
      {
        id: 'step-gg-02',
        order: 2,
        title: 'Xử lý ra hoa — phun Paclobutrazol',
        description:
          'Phun Paclobutrazol (PBZ) vào giai đoạn khô hạn để ức chế sinh trưởng và kích thích ra hoa. Liều lượng theo khuyến cáo nhà sản xuất.',
        expectedDurationDays: 3,
        acceptanceCriteria:
          'Ghi nhận ngày phun, nồng độ, người thực hiện; tỷ lệ ra hoa ≥ 70% sau 45 ngày; lưu phiếu xuất kho thuốc.',
      },
      {
        id: 'step-gg-03',
        order: 3,
        title: 'Quản lý sâu bệnh IPM',
        description:
          'Áp dụng IPM (Quản lý Dịch hại Tổng hợp): bẫy bướm đêm, nhân nuôi thiên địch, phun thuốc sinh học trước khi dùng thuốc hóa học.',
        expectedDurationDays: 30,
        acceptanceCriteria:
          'Lưu nhật ký quan trắc 2 lần/tuần; tỷ lệ sử dụng thuốc sinh học ≥ 60%; không phát hiện dư lượng vượt MRL.',
      },
      {
        id: 'step-gg-04',
        order: 4,
        title: 'Bao trái',
        description:
          'Bao trái sau đậu quả 30–35 ngày bằng túi không dệt (PP non-woven) để ngăn sâu đục, cháy nắng và tăng màu sắc vỏ trái.',
        expectedDurationDays: 10,
        acceptanceCriteria:
          'Tỷ lệ trái được bao ≥ 90%; túi bao đúng quy cách; ghi nhận ngày bao và số lượng túi sử dụng.',
      },
      {
        id: 'step-gg-05',
        order: 5,
        title: 'Thu hoạch và sơ chế',
        description:
          'Thu hoạch khi trái đạt chỉ số TSS ≥ 12 Brix (đo bằng khúc xạ kế). Sơ chế: rửa sạch, phân loại, đóng thùng có mã QR truy xuất.',
        expectedDurationDays: 5,
        acceptanceCriteria:
          'TSS ≥ 12 Brix; tỷ lệ loại I ≥ 70%; mã QR truy xuất ghi đầy đủ farmId, batchId, ngày thu hoạch.',
      },
    ],
    createdAt: '2024-02-15T09:00:00.000Z',
  },
  {
    id: 'std-organic-001',
    code: 'ORGANIC_VN_POMELO',
    name: 'Hữu Cơ Việt Nam — Bưởi Da Xanh Bến Tre',
    description:
      'Quy trình sản xuất bưởi Da Xanh theo tiêu chuẩn Hữu Cơ Việt Nam (TCVN 11041). Cấm hoàn toàn thuốc trừ sâu hóa học và phân bón vô cơ tổng hợp.',
    ownerTraderId: undefined,
    steps: [
      {
        id: 'step-or-01',
        order: 1,
        title: 'Chuyển đổi vùng trồng hữu cơ',
        description:
          'Giai đoạn chuyển đổi 24 tháng không sử dụng hóa chất tổng hợp. Ghi chép toàn bộ đầu vào (phân, nước, giống).',
        expectedDurationDays: 730,
        acceptanceCriteria:
          'Hồ sơ chuyển đổi đầy đủ 24 tháng; không phát hiện dư lượng thuốc trừ sâu trong mẫu đất và trái; kiểm tra bởi tổ chức chứng nhận.',
      },
      {
        id: 'step-or-02',
        order: 2,
        title: 'Bón phân hữu cơ hoai mục',
        description:
          'Chỉ sử dụng phân hữu cơ hoai mục (phân chuồng ủ nóng ≥ 60°C trong 30 ngày hoặc phân trùn quế). Liều 10–15 kg/cây/năm.',
        expectedDurationDays: 5,
        acceptanceCriteria:
          'Nhiệt độ ủ phân đạt ≥ 60°C có ghi nhận; không lẫn rác thải công nghiệp; lưu phiếu xuất nhập kho phân.',
      },
      {
        id: 'step-or-03',
        order: 3,
        title: 'Kiểm soát sâu bệnh bằng biện pháp sinh học',
        description:
          'Dùng chế phẩm sinh học (Bacillus thuringiensis, nấm Metarhizium), bẫy pheromone, trồng cây xua đuổi côn trùng (sả, húng quế) xen canh.',
        expectedDurationDays: 60,
        acceptanceCriteria:
          'Không sử dụng bất kỳ thuốc trừ sâu hóa học nào; ghi nhật ký phát sinh dịch hại và biện pháp xử lý; tỷ lệ trái bị sâu bệnh < 10%.',
      },
      {
        id: 'step-or-04',
        order: 4,
        title: 'Thu hoạch và xử lý sau thu hoạch hữu cơ',
        description:
          'Thu hoạch thủ công khi trái đạt 180–200 ngày sau đậu quả. Không xử lý hóa chất bảo quản. Đóng gói trong vật liệu tái chế có chứng nhận hữu cơ.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Không phát hiện dư lượng hóa chất bảo quản; bao bì đúng chứng nhận hữu cơ; ghi lô và ngày thu hoạch cho truy xuất.',
      },
    ],
    createdAt: '2023-11-01T07:00:00.000Z',
  },
];

let standardStore: StandardDto[] = [...SEED_STANDARDS];

// ── Service functions (mirror standardService.ts API surface) ─────────────────

export async function listStandards(
  params: ListStandardsParams = {},
): Promise<ListResponse<StandardDto>> {
  const { page = 1, limit = 10, ownerTraderId } = params;

  const filtered = standardStore.filter((s) => {
    if (ownerTraderId !== undefined && s.ownerTraderId !== ownerTraderId) return false;
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return withMockDelay({ items, page, limit, total });
}

export async function getStandard(id: string): Promise<StandardDto> {
  const standard = standardStore.find((s) => s.id === id);
  if (!standard) throw new Error(`NOT_FOUND: Standard ${id}`);
  return withMockDelay({ ...standard, steps: [...standard.steps] });
}

export async function createStandard(data: CreateStandardDto): Promise<StandardDto> {
  const now = new Date().toISOString();
  const newStandard: StandardDto = {
    ...data,
    id: `std-${Date.now()}`,
    ownerTraderId: 'user-trader-001',
    createdAt: now,
  };
  standardStore = [...standardStore, newStandard];
  return withMockDelay({ ...newStandard });
}

export async function updateStandard(id: string, data: UpdateStandardDto): Promise<StandardDto> {
  const idx = standardStore.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: Standard ${id}`);
  const updated: StandardDto = {
    ...standardStore[idx],
    ...data,
    steps: data.steps ?? standardStore[idx].steps,
  };
  standardStore = standardStore.map((s, i) => (i === idx ? updated : s));
  return withMockDelay({ ...updated });
}

export async function deleteStandard(id: string): Promise<{ success: true }> {
  standardStore = standardStore.filter((s) => s.id !== id);
  return withMockDelay({ success: true as const });
}
