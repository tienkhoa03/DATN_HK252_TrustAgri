import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StandardEntity } from './entities/standard.entity';
import { StandardStepEntity } from './entities/standard-step.entity';

interface SeedStep {
  order: number;
  title: string;
  description: string;
  expectedDurationDays?: number;
  acceptanceCriteria?: string;
}

interface SeedStandard {
  code: string;
  name: string;
  description: string;
  steps: SeedStep[];
}

const SYSTEM_STANDARDS: SeedStandard[] = [
  {
    code: 'VIETGAP_2024',
    name: 'VietGAP 2024',
    description:
      'Quy trình thực hành sản xuất nông nghiệp tốt tại Việt Nam (VietGAP) — phiên bản 2024. Đảm bảo an toàn thực phẩm, sức khỏe người lao động và bảo vệ môi trường.',
    steps: [
      {
        order: 1,
        title: 'Chuẩn bị và cải tạo đất',
        description:
          'Kiểm tra, phân tích thổ nhưỡng, xử lý và cải tạo đất đảm bảo phù hợp với loại cây trồng.',
        expectedDurationDays: 14,
        acceptanceCriteria:
          'Kết quả phân tích đất đạt yêu cầu pH và dinh dưỡng tối thiểu theo tiêu chuẩn VietGAP.',
      },
      {
        order: 2,
        title: 'Bón phân lót',
        description:
          'Bón phân hữu cơ đã ủ hoai mục hoặc phân vô cơ theo tỉ lệ khuyến cáo trước khi gieo trồng.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Lượng phân lót đúng liều; phân hữu cơ đã qua xử lý nhiệt đảm bảo không còn mầm bệnh.',
      },
      {
        order: 3,
        title: 'Gieo hạt / Trồng cây con',
        description:
          'Sử dụng giống đã được kiểm định chất lượng, trồng đúng mật độ và thời vụ.',
        expectedDurationDays: 3,
        acceptanceCriteria:
          'Tỉ lệ nảy mầm hoặc bén rễ ≥ 80% sau 7 ngày.',
      },
      {
        order: 4,
        title: 'Tưới nước và quản lý độ ẩm',
        description:
          'Tưới nước đúng lịch, đảm bảo độ ẩm đất phù hợp; ưu tiên tưới nhỏ giọt hoặc tưới phun.',
        expectedDurationDays: 90,
        acceptanceCriteria:
          'Độ ẩm đất duy trì trong ngưỡng 60–80% theo loại cây.',
      },
      {
        order: 5,
        title: 'Bón phân thúc',
        description:
          'Bón phân theo giai đoạn sinh trưởng của cây, ghi chép đầy đủ loại phân và liều lượng.',
        expectedDurationDays: 60,
        acceptanceCriteria:
          'Hồ sơ bón phân đầy đủ; không sử dụng phân bị cấm theo danh mục VietGAP.',
      },
      {
        order: 6,
        title: 'Phòng trừ sâu bệnh (IPM)',
        description:
          'Áp dụng quản lý dịch hại tổng hợp (IPM): ưu tiên biện pháp sinh học, hóa học chỉ dùng khi cần thiết, đảm bảo thời gian cách ly.',
        expectedDurationDays: 30,
        acceptanceCriteria:
          'Chỉ sử dụng thuốc BVTV trong danh mục được phép; thời gian cách ly trước thu hoạch đúng theo hướng dẫn.',
      },
      {
        order: 7,
        title: 'Thu hoạch',
        description:
          'Thu hoạch đúng thời điểm chín kỹ thuật, dụng cụ thu hoạch sạch sẽ, không để hỏng hóc.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Sản phẩm đạt yêu cầu ngoại quan, không có dư lượng thuốc BVTV vượt mức cho phép (MRL).',
      },
      {
        order: 8,
        title: 'Xử lý sau thu hoạch',
        description:
          'Phân loại, làm sạch, đóng gói và bảo quản sản phẩm đúng điều kiện nhiệt độ/độ ẩm.',
        expectedDurationDays: 3,
        acceptanceCriteria:
          'Sản phẩm được dán nhãn đúng quy định VietGAP, truy xuất được nguồn gốc theo lô.',
      },
    ],
  },
  {
    code: 'GLOBALGAP_2024',
    name: 'GlobalG.A.P. 2024',
    description:
      'Tiêu chuẩn thực hành nông nghiệp tốt toàn cầu (GlobalG.A.P.) — phiên bản 2024. Tiêu chuẩn quốc tế giúp tiếp cận thị trường xuất khẩu.',
    steps: [
      {
        order: 1,
        title: 'Hồ sơ địa điểm và quản lý lịch sử',
        description:
          'Ghi chép lịch sử sử dụng đất, đánh giá rủi ro ô nhiễm, lập bản đồ vườn và hồ sơ địa điểm sản xuất.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Hồ sơ địa điểm đầy đủ, bản đồ vườn được phê duyệt bởi cơ quan chứng nhận.',
      },
      {
        order: 2,
        title: 'Quản lý đất và giá thể',
        description:
          'Phân tích định kỳ thổ nhưỡng, lập kế hoạch bảo tồn đất, ngăn ngừa xói mòn và nhiễm bẩn chéo.',
        expectedDurationDays: 14,
        acceptanceCriteria:
          'Báo cáo phân tích đất < 3 năm tuổi; kế hoạch bảo tồn đất được thực thi.',
      },
      {
        order: 3,
        title: 'Bón phân (Fertilization)',
        description:
          'Lập kế hoạch dinh dưỡng dựa trên phân tích đất/lá, ghi chép mọi lần bón và nguồn gốc phân bón.',
        expectedDurationDays: 60,
        acceptanceCriteria:
          'Tất cả phân bón có hóa đơn và nguồn gốc rõ ràng; không dùng phân bùn thải chưa xử lý.',
      },
      {
        order: 4,
        title: 'Tưới nước / Fertigatin',
        description:
          'Kiểm tra chất lượng nước tưới định kỳ, ghi chép nguồn và lượng nước sử dụng.',
        expectedDurationDays: 90,
        acceptanceCriteria:
          'Kết quả kiểm tra nước ≤ mức giới hạn vi sinh và hóa chất theo GlobalGAP.',
      },
      {
        order: 5,
        title: 'Bảo vệ thực vật (Crop Protection)',
        description:
          'Chỉ sử dụng thuốc BVTV được đăng ký, áp dụng đúng liều và thời gian cách ly, lưu trữ an toàn.',
        expectedDurationDays: 30,
        acceptanceCriteria:
          'Hồ sơ phun thuốc đầy đủ; hàm lượng dư lượng kiểm tra bởi lab bên thứ ba đạt MRL.',
      },
      {
        order: 6,
        title: 'Thu hoạch (Harvesting)',
        description:
          'Vệ sinh dụng cụ, đảm bảo điều kiện thu hoạch an toàn thực phẩm, truy xuất lô hàng.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Sản phẩm đạt tiêu chuẩn vệ sinh an toàn, có mã lô truy xuất ngược lên vườn.',
      },
      {
        order: 7,
        title: 'Xử lý và bảo quản sau thu hoạch',
        description:
          'Đóng gói, dán nhãn và bảo quản lạnh theo yêu cầu của thị trường xuất khẩu.',
        expectedDurationDays: 3,
        acceptanceCriteria:
          'Nhãn sản phẩm đúng chuẩn GlobalGAP; điều kiện bảo quản ghi chép đầy đủ.',
      },
    ],
  },
  {
    code: 'ORGANIC_VN_2024',
    name: 'Hữu cơ Việt Nam 2024',
    description:
      'Tiêu chuẩn canh tác hữu cơ Việt Nam (TCVN 11041) — phiên bản 2024. Không sử dụng hóa chất tổng hợp, ưu tiên bảo tồn đa dạng sinh học.',
    steps: [
      {
        order: 1,
        title: 'Chuyển đổi và chuẩn bị đất hữu cơ',
        description:
          'Thực hiện giai đoạn chuyển đổi tối thiểu 24 tháng, cải tạo đất bằng phân xanh và phân hữu cơ ủ hoai.',
        expectedDurationDays: 730,
        acceptanceCriteria:
          'Hoàn thành giai đoạn chuyển đổi; đất không có dư lượng hóa chất tổng hợp vượt ngưỡng.',
      },
      {
        order: 2,
        title: 'Quản lý dinh dưỡng hữu cơ',
        description:
          'Chỉ sử dụng phân bón hữu cơ (phân chuồng ủ, compost, phân xanh, chế phẩm sinh học) được phê duyệt theo TCVN 11041.',
        expectedDurationDays: 90,
        acceptanceCriteria:
          'Toàn bộ đầu vào có nguồn gốc hữu cơ hoặc được cơ quan chứng nhận hữu cơ phê duyệt.',
      },
      {
        order: 3,
        title: 'Quản lý dịch hại tự nhiên',
        description:
          'Kiểm soát sâu bệnh bằng thiên địch, bẫy, bao trái và các biện pháp sinh học; tuyệt đối không dùng hóa chất tổng hợp.',
        expectedDurationDays: 60,
        acceptanceCriteria:
          'Không phát hiện dư lượng thuốc trừ sâu tổng hợp; thiên địch được duy trì trong vườn.',
      },
      {
        order: 4,
        title: 'Tưới nước và quản lý nước hữu cơ',
        description:
          'Sử dụng nước sạch, không bị ô nhiễm; ưu tiên tái sử dụng nước mưa và tưới nhỏ giọt tiết kiệm.',
        expectedDurationDays: 90,
        acceptanceCriteria:
          'Nước tưới đạt tiêu chuẩn vệ sinh; không có chất ô nhiễm hóa học từ nguồn nước.',
      },
      {
        order: 5,
        title: 'Thu hoạch và xử lý hữu cơ',
        description:
          'Thu hoạch bằng dụng cụ sạch, đóng gói riêng biệt với sản phẩm thông thường, dán nhãn hữu cơ.',
        expectedDurationDays: 7,
        acceptanceCriteria:
          'Sản phẩm không bị lẫn với hàng thông thường; nhãn ghi rõ "Hữu cơ — TCVN 11041".',
      },
      {
        order: 6,
        title: 'Kiểm tra và chứng nhận',
        description:
          'Nộp hồ sơ cho tổ chức chứng nhận hữu cơ, cho phép thanh tra vườn định kỳ hàng năm.',
        expectedDurationDays: 30,
        acceptanceCriteria:
          'Giấy chứng nhận hữu cơ được cấp hoặc gia hạn; không có cảnh báo vi phạm từ đợt thanh tra.',
      },
    ],
  },
];

@Injectable()
export class StandardsSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(StandardsSeeder.name);

  constructor(
    @InjectRepository(StandardEntity)
    private readonly standardRepo: Repository<StandardEntity>,
    @InjectRepository(StandardStepEntity)
    private readonly stepRepo: Repository<StandardStepEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const seed of SYSTEM_STANDARDS) {
      const exists = await this.standardRepo.findOne({
        where: { code: seed.code },
        withDeleted: true,
      });

      if (exists) {
        this.logger.debug(`Seed '${seed.code}' already exists — skipping.`);
        continue;
      }

      const standard = this.standardRepo.create({
        code: seed.code,
        name: seed.name,
        description: seed.description,
        ownerTraderId: null,
      });
      const saved = await this.standardRepo.save(standard);

      const stepEntities = seed.steps.map((s) =>
        this.stepRepo.create({
          standardId: saved.id,
          order: s.order,
          title: s.title,
          description: s.description,
          expectedDurationDays: s.expectedDurationDays ?? null,
          acceptanceCriteria: s.acceptanceCriteria ?? null,
        }),
      );
      await this.stepRepo.save(stepEntities);

      this.logger.log(
        `Seeded system standard '${seed.code}' with ${seed.steps.length} steps.`,
      );
    }
  }
}
