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

import React, { useState } from 'react';
import { Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface ContractChange {
  id?: string; // Add ID to track individual changes
  field: string;
  oldValue: string;
  newValue: string;
  reason?: string;
  status?: 'pending' | 'accepted' | 'rejected'; // Track status of each change
}

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
  changes?: ContractChange[];
  createdDate: Date;
}

export interface FarmerContractsScreenProps {
  farmerName?: string;
  farmName?: string;
  contracts?: Contract[];
  onAcceptChange?: (contractId: string) => void;
  onRejectChange?: (contractId: string) => void;
  onViewDetails?: (contractId: string) => void;
  onBack?: () => void;
}

/**
 * Farmer Contracts Screen Component
 * Quản lý hợp đồng bao tiêu với thương lái
 */
export const FarmerContractsScreen: React.FC<FarmerContractsScreenProps> = ({
  farmerName = 'Tiến Khoa',
  farmName = 'Sầu riêng Monthong',
  contracts: initialContracts,
  onAcceptChange,
  onRejectChange,
  onViewDetails,
  onBack,
}) => {
  // Default contracts data
  const defaultContracts: Contract[] = [
    {
      id: '1',
      traderName: 'Công ty TNHH Trái cây Miền Nam',
      productType: 'Sầu riêng Monthong',
      quantity: 2,
      unit: 'tấn',
      harvestDate: new Date('2024-03-15'),
      price: 120000,
      status: 'active',
      terms: [
        'Chất lượng: Loại 1, độ ngọt tối thiểu 28 Brix',
        'Kích thước: Trung bình 2-3kg/trái',
        'Không dư lượng thuốc BVTV',
        'Thanh toán: 50% đặt cọc, 50% khi giao hàng',
        'Giao hàng tại vườn',
      ],
      depositAmount: 120000000,
      depositPaid: true,
      createdDate: new Date('2024-01-10'),
    },
    {
      id: '2',
      traderName: 'Hợp tác xã Nông sản Đồng Tháp',
      productType: 'Sầu riêng Ri6',
      quantity: 1500,
      unit: 'kg',
      harvestDate: new Date('2024-03-20'),
      price: 110000,
      status: 'pending_change',
      terms: [
        'Chất lượng: Loại 1, độ ngọt tối thiểu 26 Brix',
        'Kích thước: Trung bình 1.5-2kg/trái',
        'Không dư lượng thuốc BVTV',
        'Thanh toán: 30% đặt cọc, 70% khi giao hàng',
        'Giao hàng tại kho HTX',
      ],
      depositAmount: 49500000,
      depositPaid: true,
      changes: [
        {
          id: 'change-1',
          field: 'Ngày thu hoạch',
          oldValue: '15/03/2024',
          newValue: '20/03/2024',
          reason: 'Thời tiết mưa kéo dài, cần thêm thời gian để trái chín đều',
          status: 'pending',
        },
        {
          id: 'change-2',
          field: 'Số lượng',
          oldValue: '2 tấn',
          newValue: '1.5 tấn',
          reason: 'Một số cây bị ảnh hưởng bởi sâu bệnh',
          status: 'pending',
        },
      ],
      createdDate: new Date('2024-01-15'),
    },
    {
      id: '3',
      traderName: 'Thương lái Nguyễn Văn A',
      productType: 'Sầu riêng Monthong',
      quantity: 800,
      unit: 'kg',
      harvestDate: new Date('2024-04-01'),
      price: 115000,
      status: 'active',
      terms: [
        'Chất lượng: Loại 1-2 hỗn hợp',
        'Kích thước: Không yêu cầu',
        'Thanh toán: 100% khi giao hàng',
        'Giao hàng tại chợ đầu mối',
      ],
      depositAmount: 0,
      depositPaid: false,
      createdDate: new Date('2024-02-01'),
    },
  ];

  const [contracts, setContracts] = useState<Contract[]>(initialContracts || defaultContracts);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Debug log
  React.useEffect(() => {
    console.log('FarmerContractsScreen mounted with', contracts.length, 'contracts');
  }, []);

  // Handle accept individual change
  const handleAcceptIndividualChange = (contractId: string, changeId: string) => {
    setContracts(prev =>
      prev.map(contract => {
        if (contract.id === contractId && contract.changes) {
          const updatedChanges = contract.changes.map(change =>
            change.id === changeId ? { ...change, status: 'accepted' as const } : change
          );
          
          // Check if all changes are processed (accepted or rejected)
          const allProcessed = updatedChanges.every(c => c.status === 'accepted' || c.status === 'rejected');
          
          // If all accepted, update contract status to active
          const allAccepted = updatedChanges.every(c => c.status === 'accepted');
          
          return {
            ...contract,
            changes: updatedChanges,
            status: allProcessed && allAccepted ? 'active' : contract.status,
          };
        }
        return contract;
      })
    );
    
    // Update selected contract
    if (selectedContract && selectedContract.id === contractId && selectedContract.changes) {
      const updatedChanges = selectedContract.changes.map(change =>
        change.id === changeId ? { ...change, status: 'accepted' as const } : change
      );
      setSelectedContract({ ...selectedContract, changes: updatedChanges });
    }
  };

  // Handle reject individual change
  const handleRejectIndividualChange = (contractId: string, changeId: string) => {
    setContracts(prev =>
      prev.map(contract => {
        if (contract.id === contractId && contract.changes) {
          const updatedChanges = contract.changes.map(change =>
            change.id === changeId ? { ...change, status: 'rejected' as const } : change
          );
          
          // Check if all changes are processed
          const allProcessed = updatedChanges.every(c => c.status === 'accepted' || c.status === 'rejected');
          
          return {
            ...contract,
            changes: updatedChanges,
            status: allProcessed ? 'active' : contract.status,
          };
        }
        return contract;
      })
    );
    
    // Update selected contract
    if (selectedContract && selectedContract.id === contractId && selectedContract.changes) {
      const updatedChanges = selectedContract.changes.map(change =>
        change.id === changeId ? { ...change, status: 'rejected' as const } : change
      );
      setSelectedContract({ ...selectedContract, changes: updatedChanges });
    }
  };

  // Handle accept all changes (legacy - kept for compatibility)
  const handleAcceptChange = (contractId: string) => {
    setContracts(prev =>
      prev.map(contract =>
        contract.id === contractId
          ? { ...contract, status: 'active', changes: undefined }
          : contract
      )
    );
    setSelectedContract(null);
    if (onAcceptChange) {
      onAcceptChange(contractId);
    }
  };

  // Handle reject all changes (legacy - kept for compatibility)
  const handleRejectChange = (contractId: string) => {
    setContracts(prev =>
      prev.map(contract =>
        contract.id === contractId
          ? { ...contract, status: 'active', changes: undefined }
          : contract
      )
    );
    setSelectedContract(null);
    if (onRejectChange) {
      onRejectChange(contractId);
    }
  };

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

  const stickyFooterStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTop: `2px solid ${colors.background.secondary}`,
    padding: spacing.md,
    display: 'flex',
    gap: spacing.md,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
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
        <div style={{ marginBottom: spacing.lg }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <Text.Title size="large" style={{ color: colors.primary.agriGreen, margin: 0 }}>
                  {contracts.filter(c => c.status === 'active').length}
                </Text.Title>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  Đang thực hiện
                </Text>
              </div>
              <div>
                <Text.Title size="large" style={{ color: colors.functional.warningYellow, margin: 0 }}>
                  {contracts.filter(c => c.status === 'pending_change').length}
                </Text.Title>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  Yêu cầu thay đổi
                </Text>
              </div>
              <div>
                <Text.Title size="large" style={{ color: colors.primary.zaloBlue, margin: 0 }}>
                  {contracts.filter(c => c.status === 'completed').length}
                </Text.Title>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  Hoàn thành
                </Text>
              </div>
            </div>
          </Card>
        </div>

        {/* Contracts List */}
        <div>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            Danh sách hợp đồng ({contracts.length})
          </Text.Title>

          {contracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
              <Icon name="farm" size="lg" color={colors.text.secondary} />
              <Text style={{ marginTop: spacing.md }}>
                Chưa có hợp đồng nào
              </Text>
            </div>
          ) : (
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
                {contract.status === 'pending_change' && contract.changes && (
                  <div style={changeHighlightStyles}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                      <Icon name="alert-triangle" size="md" color={colors.functional.warningYellow} />
                      <Text
                        size="small"
                        style={{ fontWeight: fontWeight.semibold, color: colors.functional.warningYellow, margin: 0 }}
                      >
                        Có {contract.changes.length} thay đổi cần xác nhận
                      </Text>
                    </div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Nhấn để xem chi tiết và phản hồi
                    </Text>
                  </div>
                )}
              </div>
            ))
          )}
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

              {/* Changes Section */}
              {selectedContract.changes && selectedContract.changes.length > 0 && (
                <div style={{ marginBottom: spacing.lg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                    <Icon name="alert-triangle" size="md" color={colors.functional.warningYellow} />
                    <Text.Title size="small" style={{ color: colors.functional.warningYellow, margin: 0 }}>
                      Yêu cầu thay đổi
                    </Text.Title>
                  </div>

                  {selectedContract.changes.map((change, index) => {
                    const isPending = change.status === 'pending';
                    const isAccepted = change.status === 'accepted';
                    const isRejected = change.status === 'rejected';
                    
                    return (
                      <div
                        key={change.id || index}
                        style={{
                          padding: spacing.md,
                          backgroundColor: isAccepted 
                            ? `${colors.primary.agriGreen}10` 
                            : isRejected 
                            ? `${colors.functional.alertRed}10`
                            : `${colors.functional.warningYellow}10`,
                          borderRadius: '8px',
                          border: `1px solid ${
                            isAccepted 
                              ? colors.primary.agriGreen 
                              : isRejected 
                              ? colors.functional.alertRed
                              : colors.functional.warningYellow
                          }`,
                          marginBottom: spacing.md,
                        }}
                      >
                        {/* Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                          <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                            {change.field}
                          </Text>
                          {isAccepted && (
                            <span style={{ 
                              color: colors.primary.agriGreen, 
                              fontSize: fontSize.small,
                              fontWeight: fontWeight.semibold,
                            }}>
                              ✓ Đã chấp nhận
                            </span>
                          )}
                          {isRejected && (
                            <span style={{ 
                              color: colors.functional.alertRed, 
                              fontSize: fontSize.small,
                              fontWeight: fontWeight.semibold,
                            }}>
                              ✕ Đã từ chối
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: spacing.sm }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                              Cũ:
                            </Text>
                            <Text
                              size="small"
                              style={{
                                textDecoration: 'line-through',
                                color: colors.functional.alertRed,
                                margin: 0,
                              }}
                            >
                              {change.oldValue}
                            </Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
                            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                              Mới:
                            </Text>
                            <Text
                              size="small"
                              style={{
                                fontWeight: fontWeight.semibold,
                                color: colors.primary.agriGreen,
                                margin: 0,
                              }}
                            >
                              {change.newValue}
                            </Text>
                          </div>
                        </div>

                        {change.reason && (
                          <div style={{ marginTop: spacing.sm }}>
                            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                              Lý do:
                            </Text>
                            <Text size="small" style={{ color: colors.text.primary, marginTop: spacing.xs, margin: 0 }}>
                              {change.reason}
                            </Text>
                          </div>
                        )}

                        {/* Action Buttons for each change */}
                        {isPending && change.id && (
                          <div style={{ marginTop: spacing.md, display: 'flex', gap: spacing.sm }}>
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleAcceptIndividualChange(selectedContract.id, change.id!)}
                              style={{ flex: 1 }}
                            >
                              ✓ Chấp nhận
                            </Button>
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => handleRejectIndividualChange(selectedContract.id, change.id!)}
                              style={{ flex: 1 }}
                            >
                              ✕ Từ chối
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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
