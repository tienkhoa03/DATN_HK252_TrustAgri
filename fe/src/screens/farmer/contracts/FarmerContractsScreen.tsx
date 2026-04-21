/**
 * Farmer Contracts Screen
 * Màn hình Quản lý Hợp đồng
 * 
 * Requirements: FR-F05, FR-F06, US-F01
 * 
 * Features:
 * - Theo dõi cam kết bao tiêu
 * - Danh sách hợp đồng dạng thẻ dọc
 * - Thẻ "Đang thực hiện" (màu xanh): Tên thương lái, Sản lượng, Ngày thu hoạch
 * - Thẻ "Yêu cầu thay đổi" (màu vàng): Highlight phần thay đổi
 * - Chi tiết hợp đồng với điều khoản
 * - Sticky Footer: Nút Đồng ý/Từ chối thay đổi
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Text, useSnackbar } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Card } from '../../../design-system/components/Card';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import {
  listContracts,
  listContractAuditLogs,
  toContractViMessage,
  contractStatusLabelVi,
  type ContractDto,
  type ContractAuditLogDto,
} from '../../../services/contractService';
import { traderDisplayName, productDisplayName } from '../../../services/orderService';
import { ContractChangeRequestsPanel } from '@/screens/shared/contract-change-requests';

export interface Contract {
  id: string;
  traderName: string;
  traderAvatar?: string;
  productType: string;
  quantity: number; // kg or tons
  unit: 'kg' | 'tấn';
  harvestDate: Date;
  price: number; // VND per unit
  status: 'active' | 'pending_change' | 'completed' | 'cancelled';
  terms: string[];
  depositAmount?: number;
  depositPaid?: boolean;
  createdDate: Date;
  partyFarmerId?: string;
  partyTraderId: string;
  partyBuyerId?: string;
}

export interface FarmerContractsScreenProps {
  farmerName?: string;
  farmName?: string;
  traderId?: string;
  contracts?: Contract[];
  onAcceptChange?: (contractId: string) => void;
  onRejectChange?: (contractId: string) => void;
  onViewDetails?: (contractId: string) => void;
  onBack?: () => void;
}

function mapDtoToContract(dto: ContractDto): Contract {
  const traderName = traderDisplayName(dto.partyTraderId);
  const productType = dto.productId ? productDisplayName(dto.productId) : 'Sản phẩm';
  const unitNorm =
    dto.unit === 'tấn' || dto.unit === 't' ? ('tấn' as const) : ('kg' as const);
  const qty = dto.quantity;
  const pricePerUnit = qty > 0 ? Math.round(dto.totalPrice / qty) : 0;
  const terms = dto.terms
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    id: dto.id,
    traderName,
    productType,
    quantity: dto.quantity,
    unit: unitNorm,
    harvestDate: new Date(dto.endDate),
    price: pricePerUnit,
    status: dto.status,
    terms: terms.length > 0 ? terms : [dto.terms],
    depositAmount: dto.deposit,
    depositPaid: dto.deposit != null && dto.deposit > 0,
    createdDate: new Date(dto.createdAt),
    partyFarmerId: dto.partyFarmerId,
    partyTraderId: dto.partyTraderId,
    partyBuyerId: dto.partyBuyerId,
  };
}

const ContractsSkeleton: React.FC = () => (
  <div style={{ marginBottom: spacing.md }}>
    {[1, 2].map((k) => (
      <div
        key={k}
        style={{
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderRadius: '8px',
          marginBottom: spacing.md,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {[90, 70, 55, 40].map((w, i) => (
          <div
            key={i}
            style={{
              height: '12px',
              width: `${w}%`,
              backgroundColor: colors.background.secondary,
              borderRadius: '6px',
              marginBottom: spacing.sm,
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Farmer Contracts Screen Component
 * Quản lý hợp đồng bao tiêu với thương lái
 */
export const FarmerContractsScreen: React.FC<FarmerContractsScreenProps> = ({
  farmerName = 'Tiến Khoa',
  farmName = 'Sầu riêng Monthong',
  contracts: externalContracts,
  onAcceptChange: _onAcceptChange,
  onRejectChange: _onRejectChange,
  onViewDetails,
  onBack,
}) => {
  const { openSnackbar } = useSnackbar();
  const isControlled = externalContracts !== undefined;
  const [contracts, setContracts] = useState<Contract[]>(() => externalContracts ?? []);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(!isControlled);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<ContractAuditLogDto[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (!isControlled) return;
    setContracts(externalContracts ?? []);
  }, [isControlled, externalContracts]);

  useEffect(() => {
    if (isControlled) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listContracts({
      role: 'farmer',
      page: 1,
      limit: 50,
    })
      .then((res) => {
        if (cancelled) return;
        setContracts(res.items.map(mapDtoToContract));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = toContractViMessage(err, 'list');
        setLoadError(msg);
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      })
      .then(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isControlled, openSnackbar]);

  useEffect(() => {
    if (!selectedContract) {
      setAuditEntries([]);
      return;
    }
    let cancelled = false;
    setAuditLoading(true);
    listContractAuditLogs(selectedContract.id)
      .then((rows) => {
        if (!cancelled) setAuditEntries(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAuditEntries([]);
          openSnackbar({ type: 'error', text: toContractViMessage(err, 'audit'), duration: 3800, icon: true });
        }
      })
      .then(() => {
        if (!cancelled) setAuditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedContract?.id, openSnackbar]);

  const refetchContracts = useCallback(() => {
    if (isControlled) return;
    setLoading(true);
    setLoadError(null);
    listContracts({
      role: 'farmer',
      page: 1,
      limit: 50,
    })
      .then((res) => {
        const mapped = res.items.map(mapDtoToContract);
        setContracts(mapped);
        setSelectedContract((prev) => {
          if (!prev) return null;
          return mapped.find((x) => x.id === prev.id) ?? prev;
        });
      })
      .catch((err: unknown) => {
        const msg = toContractViMessage(err, 'list');
        setLoadError(msg);
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isControlled, openSnackbar]);

  const summaryCounts = useMemo(() => {
    return {
      active: contracts.filter((c) => c.status === 'active').length,
      pending: contracts.filter((c) => c.status === 'pending_change').length,
      done: contracts.filter((c) => c.status === 'completed').length,
    };
  }, [contracts]);

  // Handle view details
  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    if (onViewDetails) {
      onViewDetails(contract.id);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: Contract['status']): string => {
    switch (status) {
      case 'active':
        return colors.primary.agriGreen;
      case 'pending_change':
        return colors.functional.warningYellow;
      case 'completed':
        return colors.primary.zaloBlue;
      case 'cancelled':
        return colors.functional.alertRed;
      default:
        return colors.text.secondary;
    }
  };

  // Get status label
  const getStatusLabel = (status: Contract['status']): string => {
    switch (status) {
      case 'active':
        return 'Đang thực hiện';
      case 'pending_change':
        return 'Yêu cầu thay đổi';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  // Styles
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: spacing.md,
  };

  const contractCardStyles = (status: Contract['status']): React.CSSProperties => ({
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    border: `2px solid ${getStatusColor(status)}`,
    marginBottom: spacing.md,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const statusBadgeStyles = (status: Contract['status']): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: `${getStatusColor(status)}15`,
    color: getStatusColor(status),
    borderRadius: '4px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
  });

  const changeHighlightStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: `${colors.functional.warningYellow}15`,
    borderRadius: '8px',
    border: `1px solid ${colors.functional.warningYellow}`,
    marginTop: spacing.md,
  };

  const modalOverlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: spacing.md,
  };

  const modalContentStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  };

  const modalHeaderStyles: React.CSSProperties = {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.background.secondary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const modalBodyStyles: React.CSSProperties = {
    padding: spacing.md,
  };

  return (
    <div className="farmer-contracts-screen" style={{ minHeight: '100vh', backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <div style={headerStyles}>
          <div>
            <Text.Title size="small" style={{ margin: 0 }}>
              Quản lý Hợp đồng
            </Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              {farmName}
            </Text>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: spacing.sm,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label="Quay lại"
            >
              <Icon name="home" size="md" color={colors.text.primary} />
            </button>
          )}
        </div>

        {/* Content */}
        <div style={contentStyles}>
        {/* Summary */}
        {!loading && !loadError && (
        <div style={{ marginBottom: spacing.lg }}>
          <Card>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <Text.Title size="large" style={{ color: colors.primary.agriGreen, margin: 0 }}>
                    {summaryCounts.active}
                  </Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    Đang thực hiện
                  </Text>
                </div>
                <div>
                  <Text.Title size="large" style={{ color: colors.functional.warningYellow, margin: 0 }}>
                    {summaryCounts.pending}
                  </Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    Yêu cầu thay đổi
                  </Text>
                </div>
                <div>
                  <Text.Title size="large" style={{ color: colors.primary.zaloBlue, margin: 0 }}>
                    {summaryCounts.done}
                  </Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    Hoàn thành
                  </Text>
                </div>
              </div>
            </Card>
        </div>
        )}

        {/* Danh sách: GET /contracts (JWT + role=farmer) */}
        <div>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            Danh sách hợp đồng ({loading ? '…' : contracts.length})
          </Text.Title>

          {loading && <ContractsSkeleton />}

          {loadError && (
            <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.functional.alertRed }}>
              <Text size="small">{loadError}</Text>
            </div>
          )}

          {!loading && !loadError && contracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
              <Icon name="farm" size="lg" color={colors.text.secondary} />
              <Text style={{ marginTop: spacing.md }}>
                Chưa có hợp đồng nào
              </Text>
            </div>
          ) : !loading && !loadError ? (
            contracts.map(contract => (
              <div
                key={contract.id}
                style={contractCardStyles(contract.status)}
                onClick={() => handleViewDetails(contract)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Status Badge */}
                <div style={{ marginBottom: spacing.md }}>
                  <span style={statusBadgeStyles(contract.status)}>
                    {contract.status === 'active' && '✓'}
                    {contract.status === 'pending_change' && '⚠'}
                    {contract.status === 'completed' && '✓'}
                    {contract.status === 'cancelled' && '✕'}
                    {' '}
                    {getStatusLabel(contract.status)}
                  </span>
                </div>

                {/* Trader Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary.zaloBlue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.text.inverse,
                      fontSize: fontSize.h2,
                      fontWeight: fontWeight.semibold,
                    }}
                  >
                    {contract.traderAvatar ? (
                      <img
                        src={contract.traderAvatar}
                        alt={contract.traderName}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      />
                    ) : (
                      <span>{contract.traderName.charAt(0)}</span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <Text
                      size="normal"
                      style={{ fontWeight: fontWeight.semibold, margin: 0 }}
                    >
                      {contract.traderName}
                    </Text>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      {contract.productType}
                    </Text>
                  </div>
                </div>

                {/* Contract Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Sản lượng
                    </Text>
                    <Text
                      size="normal"
                      style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen, margin: 0 }}
                    >
                      {contract.quantity} {contract.unit}
                    </Text>
                  </div>
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Ngày thu hoạch
                    </Text>
                    <Text
                      size="normal"
                      style={{ fontWeight: fontWeight.semibold, margin: 0 }}
                    >
                      {formatDate(contract.harvestDate)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Giá
                    </Text>
                    <Text
                      size="normal"
                      style={{ fontWeight: fontWeight.semibold, margin: 0 }}
                    >
                      {formatCurrency(contract.price)}/{contract.unit}
                    </Text>
                  </div>
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Tổng giá trị
                    </Text>
                    <Text
                      size="normal"
                      style={{ fontWeight: fontWeight.semibold, color: colors.primary.zaloBlue, margin: 0 }}
                    >
                      {formatCurrency(contract.price * contract.quantity)}
                    </Text>
                  </div>
                </div>

                {/* Change Indicator */}
                {contract.status === 'pending_change' && (
                  <div style={changeHighlightStyles}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                      <Icon name="alert-triangle" size="md" color={colors.functional.warningYellow} />
                      <Text
                        size="small"
                        style={{ fontWeight: fontWeight.semibold, color: colors.functional.warningYellow, margin: 0 }}
                      >
                        Có yêu cầu thay đổi đang chờ xử lý
                      </Text>
                    </div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Nhấn để xem chi tiết, diff và phản hồi đối tác
                    </Text>
                  </div>
                )}
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Contract Details Modal */}
      {selectedContract && (
        <div
          style={modalOverlayStyles}
          onClick={() => setSelectedContract(null)}
        >
          <div
            style={modalContentStyles}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={modalHeaderStyles}>
              <Text.Title size="small" style={{ margin: 0 }}>
                Chi tiết hợp đồng
              </Text.Title>
              <button
                onClick={() => setSelectedContract(null)}
                style={{
                  padding: spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Đóng"
              >
                <Icon name="close" size="md" color={colors.text.primary} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={modalBodyStyles}>
              {/* Status */}
              <div style={{ marginBottom: spacing.md }}>
                <span style={statusBadgeStyles(selectedContract.status)}>
                  {selectedContract.status === 'active' && '✓'}
                  {selectedContract.status === 'pending_change' && '⚠'}
                  {selectedContract.status === 'completed' && '✓'}
                  {selectedContract.status === 'cancelled' && '✕'}
                  {' '}
                  {getStatusLabel(selectedContract.status)}
                </span>
              </div>

              {/* Nhật ký trạng thái (BE: GET .../audit-logs) */}
              <div style={{ marginBottom: spacing.lg }}>
                <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
                  Nhật ký thay đổi trạng thái
                </Text.Title>
                {auditLoading ? (
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    Đang tải...
                  </Text>
                ) : auditEntries.length === 0 ? (
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    Chưa có bản ghi (hoặc hợp đồng mới tạo).
                  </Text>
                ) : (
                  <div
                    style={{
                      padding: spacing.sm,
                      backgroundColor: colors.background.secondary,
                      borderRadius: '8px',
                      maxHeight: '160px',
                      overflowY: 'auto',
                    }}
                  >
                    {auditEntries.map((a) => {
                      const when = new Date(a.occurredAt).toLocaleString('vi-VN');
                      const from = a.previousStatus
                        ? contractStatusLabelVi(a.previousStatus as ContractDto['status'])
                        : '—';
                      const to = contractStatusLabelVi(a.newStatus as ContractDto['status']);
                      return (
                        <div
                          key={a.id}
                          style={{
                            paddingBottom: spacing.sm,
                            marginBottom: spacing.sm,
                            borderBottom: `1px solid ${colors.background.tertiary}`,
                          }}
                        >
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                            {when}
                          </Text>
                          <Text size="small" style={{ margin: 0 }}>
                            {from} → {to}
                          </Text>
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                            Người thao tác #{a.actorUserId.slice(0, 8)}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trader Info */}
              <div style={{ marginBottom: spacing.lg }}>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  Thương lái
                </Text>
                <Text.Title size="small" style={{ margin: 0 }}>
                  {selectedContract.traderName}
                </Text.Title>
              </div>

              {/* Contract Info */}
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ marginBottom: spacing.md }}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Sản phẩm
                  </Text>
                  <Text size="normal" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
                    {selectedContract.productType}
                  </Text>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
                  <div>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      Sản lượng
                    </Text>
                    <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                      {selectedContract.quantity} {selectedContract.unit}
                    </Text>
                  </div>
                  <div>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      Giá
                    </Text>
                    <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                      {formatCurrency(selectedContract.price)}/{selectedContract.unit}
                    </Text>
                  </div>
                </div>

                <div style={{ marginBottom: spacing.md }}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Ngày thu hoạch
                  </Text>
                  <Text size="normal" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
                    {formatDate(selectedContract.harvestDate)}
                  </Text>
                </div>

                <div style={{ marginBottom: spacing.md }}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Tổng giá trị
                  </Text>
                  <Text.Title size="small" style={{ color: colors.primary.zaloBlue, margin: 0 }}>
                    {formatCurrency(selectedContract.price * selectedContract.quantity)}
                  </Text.Title>
                </div>

                {selectedContract.depositAmount && selectedContract.depositAmount > 0 && (
                  <div>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      Đặt cọc
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <Text size="normal" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
                        {formatCurrency(selectedContract.depositAmount)}
                      </Text>
                      {selectedContract.depositPaid && (
                        <span style={{ color: colors.primary.agriGreen, fontSize: fontSize.small }}>
                          ✓ Đã thanh toán
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <ContractChangeRequestsPanel
                contractId={selectedContract.id}
                contract={{
                  partyFarmerId: selectedContract.partyFarmerId,
                  partyTraderId: selectedContract.partyTraderId,
                  partyBuyerId: selectedContract.partyBuyerId,
                  contractType: 'farmer_trader',
                }}
                viewerRole="farmer"
                onMutationSuccess={refetchContracts}
              />

              {/* Terms Section */}
              <div>
                <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                  Điều khoản hợp đồng
                </Text.Title>
                <div
                  style={{
                    padding: spacing.md,
                    backgroundColor: colors.background.secondary,
                    borderRadius: '8px',
                  }}
                >
                  {selectedContract.terms.map((term, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: spacing.sm,
                        marginBottom: index < selectedContract.terms.length - 1 ? spacing.sm : 0,
                      }}
                    >
                      <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                        {index + 1}.
                      </Text>
                      <Text size="small" style={{ color: colors.text.primary, margin: 0 }}>
                        {term}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contract Dates */}
              <div style={{ marginTop: spacing.lg, paddingTop: spacing.md, borderTop: `1px solid ${colors.background.secondary}` }}>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  Ngày ký: {formatDate(selectedContract.createdDate)}
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerContractsScreen;
