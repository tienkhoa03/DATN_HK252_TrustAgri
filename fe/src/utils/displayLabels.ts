import type { ConnectionDto } from '@/services/connectionService';
import type { ContractDto } from '@/services/contractService';

type RoleLabel = 'Nông dân' | 'Người mua' | 'Thương lái';

/** Tên + SĐT — ưu tiên denorm từ BE; fallback tên theo id nếu thiếu tên. */
export function userDisplayLabel(
  displayName: string | null | undefined,
  userId: string,
  roleLabel: RoleLabel,
  phone?: string | null,
): string {
  const trimmed = displayName?.trim();
  const namePart = trimmed || `${roleLabel} #${userId.slice(0, 8)}`;
  const phonePart = phone?.trim();
  return phonePart ? `${namePart} - ${phonePart}` : namePart;
}

/** Tên vườn — ưu tiên denorm từ BE, fallback id ngắn. */
export function farmDisplayLabel(
  farmName: string | null | undefined,
  farmId: string,
): string {
  const trimmed = farmName?.trim();
  if (trimmed) return trimmed;
  return `Vườn #${farmId.slice(0, 8)}`;
}

export function partyFarmerDisplay(
  contract: Pick<ContractDto, 'partyFarmerId' | 'partyFarmerName' | 'partyFarmerPhone'>,
): string {
  if (!contract.partyFarmerId) return '—';
  return userDisplayLabel(
    contract.partyFarmerName,
    contract.partyFarmerId,
    'Nông dân',
    contract.partyFarmerPhone,
  );
}

export function partyBuyerDisplay(
  contract: Pick<ContractDto, 'partyBuyerId' | 'partyBuyerName' | 'partyBuyerPhone'>,
): string {
  if (!contract.partyBuyerId) return '—';
  return userDisplayLabel(
    contract.partyBuyerName,
    contract.partyBuyerId,
    'Người mua',
    contract.partyBuyerPhone,
  );
}

export function partyTraderDisplay(
  contract: Pick<ContractDto, 'partyTraderId' | 'partyTraderName' | 'partyTraderPhone'>,
): string {
  return userDisplayLabel(
    contract.partyTraderName,
    contract.partyTraderId,
    'Thương lái',
    contract.partyTraderPhone,
  );
}

export function connectionFarmerDisplay(conn: ConnectionDto): string {
  const id = conn.fromRole === 'farmer' ? conn.fromUserId : conn.toUserId;
  const name = conn.fromRole === 'farmer' ? conn.fromUserName : conn.toUserName;
  const phone = conn.fromRole === 'farmer' ? conn.fromUserPhone : conn.toUserPhone;
  return userDisplayLabel(name, id, 'Nông dân', phone);
}

/** Bên đối tác trên danh sách kết nối (incoming = người gửi, outgoing = người nhận). */
export function connectionCounterpartDisplay(
  conn: ConnectionDto,
  direction: 'incoming' | 'outgoing',
): string {
  const id = direction === 'incoming' ? conn.fromUserId : conn.toUserId;
  const name = direction === 'incoming' ? conn.fromUserName : conn.toUserName;
  const phone = direction === 'incoming' ? conn.fromUserPhone : conn.toUserPhone;
  const role = direction === 'incoming' ? conn.fromRole : conn.toRole;
  const roleLabel: RoleLabel = role === 'trader' ? 'Thương lái' : 'Nông dân';
  return userDisplayLabel(name, id, roleLabel, phone);
}

export function orderBuyerDisplay(
  order: { buyerId: string; buyerDisplayName?: string | null; buyerPhone?: string | null },
): string {
  return userDisplayLabel(order.buyerDisplayName, order.buyerId, 'Người mua', order.buyerPhone);
}

export function orderTraderDisplay(
  order: { traderId: string; traderDisplayName?: string | null; traderPhone?: string | null },
): string {
  return userDisplayLabel(order.traderDisplayName, order.traderId, 'Thương lái', order.traderPhone);
}

export function proposalTraderDisplay(
  proposal: { traderId: string; traderDisplayName?: string | null; traderPhone?: string | null },
): string {
  return userDisplayLabel(proposal.traderDisplayName, proposal.traderId, 'Thương lái', proposal.traderPhone);
}

export function proposalFarmDisplay(
  proposal: { farmId?: string; farmName?: string | null },
): string {
  if (!proposal.farmId) return '—';
  return farmDisplayLabel(proposal.farmName, proposal.farmId);
}

export function productTraderDisplay(
  product: { traderId: string; traderDisplayName?: string | null; traderPhone?: string | null },
): string {
  return userDisplayLabel(product.traderDisplayName, product.traderId, 'Thương lái', product.traderPhone);
}

export function farmOwnerDisplay(
  farm: { ownerId: string; ownerDisplayName?: string | null; ownerPhone?: string | null },
  resolvedName?: string | null,
  resolvedPhone?: string | null,
): string {
  return userDisplayLabel(
    farm.ownerDisplayName ?? resolvedName,
    farm.ownerId,
    'Nông dân',
    farm.ownerPhone ?? resolvedPhone,
  );
}

export function buyingRequestBuyerDisplay(
  req: {
    buyerId: string;
    buyerDisplayName?: string | null;
    buyerPhone?: string | null;
    buyerName?: string | null;
  },
): string {
  return userDisplayLabel(
    req.buyerDisplayName ?? req.buyerName,
    req.buyerId,
    'Người mua',
    req.buyerPhone,
  );
}

export function changeRequestActorDisplay(
  userId: string | undefined,
  displayName?: string | null,
  phone?: string | null,
): string | undefined {
  if (!userId) return undefined;
  return userDisplayLabel(displayName, userId, 'Người mua', phone);
}

/** Tên bên trong hợp đồng theo userId — dùng cho change-request / audit. */
export function contractPartyDisplay(
  userId: string | undefined,
  contract?: Pick<
    ContractDto,
    | 'partyFarmerId'
    | 'partyFarmerName'
    | 'partyFarmerPhone'
    | 'partyTraderId'
    | 'partyTraderName'
    | 'partyTraderPhone'
    | 'partyBuyerId'
    | 'partyBuyerName'
    | 'partyBuyerPhone'
  >,
): string {
  if (!userId) return '—';
  if (contract?.partyTraderId === userId) return partyTraderDisplay(contract);
  if (contract?.partyFarmerId === userId) return partyFarmerDisplay(contract);
  if (contract?.partyBuyerId === userId) return partyBuyerDisplay(contract);
  return userDisplayLabel(undefined, userId, 'Thương lái');
}
