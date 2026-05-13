/**
 * CreateFarmerContractModal — Trader tạo hợp đồng bao tiêu với nông dân (FR-T09)
 * POST /api/v1/contracts  { contractType: 'farmer_trader', partyFarmerId, partyTraderId, ... }
 */
import React, { useState } from 'react';
import { Text } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import {
  createContract,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

const UNIT_OPTIONS = ['kg', 'tấn', 'thùng', 'bao', 'tạ'];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function oneYearLaterStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

export interface CreateFarmerContractModalProps {
  visible: boolean;
  farmerUserId: string;
  farmId: string | null;
  onClose: () => void;
  onCreated: (contract: ContractDto) => void;
}

export const CreateFarmerContractModal: React.FC<CreateFarmerContractModalProps> = ({
  visible,
  farmerUserId,
  farmId: initialFarmId,
  onClose,
  onCreated,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);

  const [farmId, setFarmId] = useState(initialFarmId ?? '');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [totalPrice, setTotalPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(oneYearLaterStr);
  const [terms, setTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  const validate = (): string | null => {
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0)
      return 'Số lượng phải lớn hơn 0';
    if (!totalPrice || isNaN(Number(totalPrice)) || Number(totalPrice) < 0)
      return 'Giá trị hợp đồng không hợp lệ';
    if (deposit && (isNaN(Number(deposit)) || Number(deposit) < 0))
      return 'Tiền đặt cọc không hợp lệ';
    if (deposit && Number(deposit) > Number(totalPrice))
      return 'Tiền đặt cọc không được vượt quá giá trị hợp đồng';
    if (!startDate || !endDate) return 'Vui lòng chọn ngày bắt đầu và kết thúc';
    if (endDate < startDate) return 'Ngày kết thúc phải sau ngày bắt đầu';
    if (!session?.userId) return 'Phiên đăng nhập hết hạn';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      openSnackbar({ type: 'error', text: err, duration: 3000, icon: true });
      return;
    }

    setSubmitting(true);
    try {
      const contract = await createContract({
        contractType: 'farmer_trader',
        partyFarmerId: farmerUserId,
        partyTraderId: session!.userId,
        farmId: farmId.trim() || undefined,
        quantity: Number(quantity),
        unit,
        totalPrice: Number(totalPrice),
        deposit: deposit ? Number(deposit) : undefined,
        startDate,
        endDate,
        terms: terms.trim() || `Hợp đồng bao tiêu với nông dân ${farmerUserId.slice(-4)}`,
      });
      openSnackbar({ type: 'success', text: 'Đã tạo hợp đồng — đang chờ ký.', duration: 3000, icon: true });
      onCreated(contract);
    } catch (e) {
      openSnackbar({ type: 'error', text: toContractViMessage(e, 'create'), duration: 3500, icon: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background.primary,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          borderBottom: `1px solid ${colors.background.secondary}`,
          position: 'sticky',
          top: 0,
          backgroundColor: colors.background.primary,
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          disabled={submitting}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: spacing.xs,
            fontSize: 20,
            color: colors.text.primary,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ✕
        </button>
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>Tạo hợp đồng bao tiêu</Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            Nông dân #{farmerUserId.slice(-4)}
          </Text>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: spacing.md, paddingBottom: 100 }}>

        {/* FarmId */}
        <FormField label="Mã vườn (nếu có)">
          <input
            type="text"
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            placeholder="UUID vườn — để trống nếu chưa xác định"
            disabled={!!initialFarmId}
            style={inputStyle(!!initialFarmId)}
          />
          {initialFarmId && (
            <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: 4 }}>
              Tự động lấy từ yêu cầu kết nối
            </Text>
          )}
        </FormField>

        {/* Quantity + Unit */}
        <FormField label="Số lượng *">
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <input
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min="0"
              style={{ ...inputStyle(), flex: 2 }}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ ...inputStyle(), flex: 1, cursor: 'pointer' }}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </FormField>

        {/* Total price */}
        <FormField label="Giá trị hợp đồng (VNĐ) *">
          <input
            type="number"
            inputMode="numeric"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            placeholder="0"
            min="0"
            style={inputStyle()}
          />
        </FormField>

        {/* Deposit */}
        <FormField label="Tiền đặt cọc (VNĐ, tùy chọn)">
          <input
            type="number"
            inputMode="numeric"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="Để trống nếu không đặt cọc"
            min="0"
            style={inputStyle()}
          />
        </FormField>

        {/* Dates */}
        <FormField label="Ngày bắt đầu *">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle()}
          />
        </FormField>

        <FormField label="Ngày kết thúc *">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputStyle()}
          />
        </FormField>

        {/* Terms */}
        <FormField label="Điều khoản hợp đồng">
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Mô tả điều khoản, yêu cầu chất lượng, phương thức giao hàng..."
            rows={4}
            style={{
              ...inputStyle(),
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </FormField>

        <div
          style={{
            padding: spacing.sm,
            backgroundColor: `${colors.primary.zaloBlue}10`,
            borderRadius: 8,
            marginBottom: spacing.md,
            border: `1px solid ${colors.primary.zaloBlue}30`,
          }}
        >
          <Text size="xSmall" style={{ color: colors.text.secondary }}>
            Hợp đồng sẽ ở trạng thái <strong>Chờ ký</strong>. Cả hai bên cần ký để hợp đồng có hiệu lực.
          </Text>
        </div>
      </div>

      {/* Sticky submit */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderTop: `1px solid ${colors.background.secondary}`,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={() => void handleSubmit()}
          disabled={submitting}
          style={{
            width: '100%',
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: submitting ? `${colors.primary.agriGreen}80` : colors.primary.agriGreen,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: fontSize.body,
            fontWeight: fontWeight.semibold,
            cursor: submitting ? 'not-allowed' : 'pointer',
            minHeight: 44,
          }}
        >
          {submitting ? 'Đang tạo...' : '📄 Tạo hợp đồng'}
        </button>
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: spacing.md }}>
    <Text size="xSmall" style={{ fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.xs, display: 'block' }}>
      {label}
    </Text>
    {children}
  </div>
);

function inputStyle(disabled = false): React.CSSProperties {
  return {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${disabled ? colors.background.secondary : '#D0D0D0'}`,
    borderRadius: 8,
    fontSize: fontSize.body,
    color: disabled ? colors.text.secondary : colors.text.primary,
    backgroundColor: disabled ? colors.background.secondary : colors.background.primary,
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 44,
  };
}
