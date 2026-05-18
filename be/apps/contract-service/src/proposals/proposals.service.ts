import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposalDto, CreateProposalDto, ListResponse } from '@trustagri/shared';
import { ProposalEntity } from './entities/proposal.entity';
import { ProposalQueryDto } from './dto/proposal-query.dto';
import { BuyingRequestEntity } from '../buying-requests/entities/buying-request.entity';
import { ContractEntity } from '../contracts/entities/contract.entity';
import { ContractAuditService } from '../contracts/contract-audit.service';
import { ContractsService } from '../contracts/contracts.service';
import { AuthClientService } from '../clients/auth-client.service';
import { FarmClientService } from '../clients/farm-client.service';
import { settledValue } from '../clients/settled.util';

@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);

  constructor(
    @InjectRepository(ProposalEntity)
    private readonly proposalRepo: Repository<ProposalEntity>,
    @InjectRepository(BuyingRequestEntity)
    private readonly buyingRequestRepo: Repository<BuyingRequestEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    private readonly contractAudit: ContractAuditService,
    private readonly contractsService: ContractsService,
    private readonly authClient: AuthClientService,
    private readonly farmClient: FarmClientService,
  ) {}

  /**
   * GET /api/v1/proposals
   * Trader thấy đề xuất của mình; buyer thấy đề xuất trên buying request của mình.
   */
  async listProposals(
    query: ProposalQueryDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<ListResponse<ProposalDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.proposalRepo
      .createQueryBuilder('p')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (requesterRole === 'trader') {
      qb.andWhere('p.traderId = :id', { id: requesterId });
    } else if (requesterRole === 'buyer') {
      // Chỉ hiện đề xuất thuộc buying request của buyer
      qb.innerJoin(
        BuyingRequestEntity,
        'br',
        'br.id = p.buyingRequestId AND br.buyerId = :buyerId',
        { buyerId: requesterId },
      );
    }

    if (query.buyingRequestId) {
      qb.andWhere('p.buyingRequestId = :brId', { brId: query.buyingRequestId });
    }

    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((r) => this.toDto(r)),
      page,
      limit,
      total,
    };
  }

  /**
   * POST /api/v1/proposals (trader)
   * Thương lái phản hồi một buying request — nguồn gốc gắn với hợp đồng farmer_trader active.
   */
  async createProposal(dto: CreateProposalDto, traderId: string): Promise<ProposalDto> {
    const buyingRequest = await this.buyingRequestRepo.findOne({
      where: { id: dto.buyingRequestId },
    });
    if (!buyingRequest) {
      throw new NotFoundException('Nhu cầu mua hàng không tồn tại');
    }
    if (buyingRequest.status !== 'open') {
      throw new BadRequestException('Chỉ có thể gửi đề xuất cho nhu cầu mua đang mở');
    }

    // Validate sourceContractId and get active farmer_trader contract
    const sourceContract = await this.contractsService.getActiveFarmerTraderContract(
      dto.sourceContractId,
      traderId,
    );

    const farmId = sourceContract.farmId;
    if (!farmId) {
      throw new BadRequestException('Hợp đồng farmer_trader không liên kết vườn.');
    }

    const [traderSnapRes] = await Promise.allSettled([
      this.authClient.getUserSnapshot(traderId),
    ]);

    const traderSnap = settledValue(traderSnapRes);

    const entity = this.proposalRepo.create({
      buyingRequestId: dto.buyingRequestId,
      traderId,
      farmId,
      sourceContractId: sourceContract.id,
      standardId: sourceContract.standardId ?? null,
      standardName: sourceContract.standardName ?? null,
      traderDisplayName: traderSnap?.displayName ?? null,
      traderPhone: traderSnap?.phone ?? null,
      farmName: sourceContract.farmName ?? null,
      price: dto.price,
      quantity: dto.quantity,
      standardCode: sourceContract.standardName ?? dto.standardCode ?? null,
      note: dto.note ?? null,
      status: 'pending',
    });

    const saved = await this.proposalRepo.save(entity);
    this.logger.log(`Proposal created: id=${saved.id} traderId=${traderId} sourceContractId=${sourceContract.id}`);
    return this.toDto(saved);
  }

  /**
   * POST /api/v1/proposals/:id/accept (buyer)
   * Buyer chấp nhận đề xuất → trạng thái accepted và tạo hợp đồng.
   */
  async acceptProposal(id: string, buyerId: string): Promise<ProposalDto> {
    const proposal = await this.requireProposal(id);

    const buyingRequest = await this.buyingRequestRepo.findOne({
      where: { id: proposal.buyingRequestId },
    });
    if (!buyingRequest) {
      throw new NotFoundException('Nhu cầu mua hàng liên kết không tồn tại');
    }
    if (buyingRequest.buyerId !== buyerId) {
      throw new ForbiddenException(
        'Chỉ người mua chủ sở hữu mới có thể chấp nhận đề xuất',
      );
    }
    if (proposal.status !== 'pending') {
      throw new BadRequestException(
        `Không thể chấp nhận đề xuất ở trạng thái "${proposal.status}"`,
      );
    }

    proposal.status = 'accepted';
    const saved = await this.proposalRepo.save(proposal);

    // Cập nhật trạng thái buying request → matched
    buyingRequest.status = 'matched';
    await this.buyingRequestRepo.save(buyingRequest);

    await this.createContractFromProposal(saved, buyingRequest);
    this.logger.log(`Proposal accepted: id=${id} buyerId=${buyerId}`);
    return this.toDto(saved);
  }

  /**
   * POST /api/v1/proposals/:id/reject (buyer)
   * Buyer từ chối đề xuất.
   */
  async rejectProposal(id: string, buyerId: string): Promise<ProposalDto> {
    const proposal = await this.requireProposal(id);

    const buyingRequest = await this.buyingRequestRepo.findOne({
      where: { id: proposal.buyingRequestId },
    });
    if (!buyingRequest) {
      throw new NotFoundException('Nhu cầu mua hàng liên kết không tồn tại');
    }
    if (buyingRequest.buyerId !== buyerId) {
      throw new ForbiddenException(
        'Chỉ người mua chủ sở hữu mới có thể từ chối đề xuất',
      );
    }
    if (proposal.status !== 'pending') {
      throw new BadRequestException(
        `Không thể từ chối đề xuất ở trạng thái "${proposal.status}"`,
      );
    }

    proposal.status = 'rejected';
    const saved = await this.proposalRepo.save(proposal);
    this.logger.log(`Proposal rejected: id=${id} buyerId=${buyerId}`);
    return this.toDto(saved);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async requireProposal(id: string): Promise<ProposalEntity> {
    const entity = await this.proposalRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Đề xuất không tồn tại');
    }
    return entity;
  }

  private async createContractFromProposal(
    proposal: ProposalEntity,
    buyingRequest: BuyingRequestEntity,
  ): Promise<void> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const totalPrice = Number(proposal.price) * Number(proposal.quantity);

    const [farmNameRes] = await Promise.allSettled([
      proposal.farmId
        ? this.farmClient.getFarmName(proposal.farmId)
        : Promise.resolve(null),
    ]);

    const contract = this.contractRepo.create({
      contractType: 'trader_buyer',
      partyTraderId: proposal.traderId,
      partyBuyerId: buyingRequest.buyerId,
      partyFarmerId: null,
      partyTraderName: proposal.traderDisplayName ?? null,
      partyTraderPhone: proposal.traderPhone ?? null,
      partyBuyerName: buyingRequest.buyerDisplayName ?? null,
      partyBuyerPhone: buyingRequest.buyerPhone ?? null,
      productId: null,
      standardId: proposal.standardId ?? null,
      standardName: proposal.standardName ?? null,
      sourceContractId: proposal.sourceContractId ?? null,
      farmId: proposal.farmId,
      farmName: settledValue(farmNameRes),
      quantity: proposal.quantity,
      unit: buyingRequest.unit,
      totalPrice,
      deposit: buyingRequest.depositOffered,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'pending_signature',
      terms: `Hợp đồng được tạo tự động từ đề xuất #${proposal.id}`,
      orderId: null,
      proposalId: proposal.id,
    });

    const saved = await this.contractRepo.save(contract);
    await this.contractAudit.logStatusChange(saved.id, null, saved.status, buyingRequest.buyerId);
    this.logger.log(`Contract auto-created from proposal: proposalId=${proposal.id}`);
  }

  private toDto(entity: ProposalEntity): ProposalDto {
    return {
      id: entity.id,
      buyingRequestId: entity.buyingRequestId,
      traderId: entity.traderId,
      farmId: entity.farmId ?? undefined,
      traderDisplayName: entity.traderDisplayName ?? null,
      traderPhone: entity.traderPhone ?? null,
      farmName: entity.farmName ?? null,
      price: Number(entity.price),
      quantity: Number(entity.quantity),
      standardCode: entity.standardCode ?? undefined,
      note: entity.note ?? undefined,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      sourceContractId: entity.sourceContractId ?? undefined,
      standardId: entity.standardId ?? undefined,
      standardName: entity.standardName ?? null,
    };
  }
}
