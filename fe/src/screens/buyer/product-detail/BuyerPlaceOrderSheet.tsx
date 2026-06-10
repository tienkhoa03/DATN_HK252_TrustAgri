/**
 * BuyerPlaceOrderSheet — bottom sheet để người mua đặt mua trực tiếp một sản phẩm
 * thương lái đang rao bán: chọn số lượng → tính tổng tiền → (tùy chọn) đặt cọc →
 * POST /orders (status=pending). Thương lái xác nhận sẽ tự sinh hợp đồng chờ ký.
 *
 * Requirements: FR-U03 (đặt hàng trước / đặt cọc), FR-T03 (thương lái xử lý đơn)
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useKeyboardInset, scrollIntoViewOnFocus } from '@/hooks/useKeyboardInset';
import { createOrder, toOrderViMessage } from '@/services/orderService';
import { cropLabel, cropEmoji, type ProductDto } from '../../../services/marketplaceService';

export interface BuyerPlaceOrderSheetProps {
  open: boolean;
  product: ProductDto;
  onClose: () => void;
  /** Gọi sau khi tạo đơn thành công (trước khi điều hướng). */
  onSuccess?: (orderId: string) => void;
}

const formatVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);

const DEPOSIT_PERCENTS = [20, 50] as const;

export const BuyerPlaceOrderSheet: React.FC<BuyerPlaceOrderSheetProps> = ({
  open,
  product,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const keyboardInset = useKeyboardInset();

  // stockQuantity có thể null (không quản kho) → không giới hạn trần.
  const maxQty = product.stockQuantity != null ? Math.max(0, Number(product.stockQuantity)) : undefined;

  const [qtyText, setQtyText] = useState('1');
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositText, setDepositText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cho phép thập phân (đơn vị có thể là kg/tấn); chuẩn hóa dấu phẩy thành chấm.
  const quantity = useMemo(() => {
    const n = Number(qtyText.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }, [qtyText]);

  const totalPrice = useMemo(
    () => Number(product.price) * (quantity > 0 ? quantity : 0),
    [product.price, quantity],
  );

  const deposit = useMemo(() => {
    if (!depositEnabled) return undefined;
    const n = Number(depositText.replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [depositEnabled, depositText]);

  // ── Validation ────────────────────────────────────────────────────────────
  const qtyError = (() => {
    if (quantity <= 0) return 'Số lượng phải lớn hơn 0';
    if (maxQty != null && quantity > maxQty) return `Chỉ còn ${maxQty} ${product.unit}`;
    return null;
  })();

  const depositError = (() => {
    if (!depositEnabled) return null;
    if (deposit == null || deposit <= 0) return 'Nhập số tiền đặt cọc hợp lệ';
    if (deposit > totalPrice) return 'Đặt cọc không được vượt quá tổng tiền';
    return null;
  })();

  const canSubmit = !qtyError && !depositError && !submitting;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const stepQty = (delta: number) => {
    const next = Math.max(0, (quantity || 0) + delta);
    const clamped = maxQty != null ? Math.min(next, maxQty) : next;
    // Bỏ phần thập phân thừa cho bước nguyên.
    setQtyText(String(Number.isInteger(clamped) ? clamped : clamped.toFixed(2)));
  };

  const applyDepositPercent = (percent: number) => {
    setDepositEnabled(true);
    setDepositText(String(Math.round((totalPrice * percent) / 100)));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const created = await createOrder({
        productId: product.id,
        quantity,
        unit: product.unit,
        ...(depositEnabled && deposit ? { deposit } : {}),
      });
      openSnackbar({
        type: 'success',
        text: 'Đã gửi đơn đặt mua! Đơn đang chờ thương lái xác nhận.',
        duration: 3500,
        icon: true,
      });
      onSuccess?.(created.id);
      onClose();
      navigate('/buyer/orders?status=negotiating');
    } catch (err) {
      openSnackbar({ type: 'error', text: toOrderViMessage(err, 'create'), duration: 4000, icon: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: spacing.sm,
    border: `1px solid ${colors.background.secondary}`,
    borderRadius: 8,
    fontSize: fontSize.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    boxSizing: 'border-box',
  };

  const stepBtnStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 8,
    border: `1px solid ${colors.background.tertiary}`,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
  };

  const errorTextStyle: React.CSSProperties = {
    color: colors.functional.alertRed,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: keyboardInset > 0 ? keyboardInset : 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        transition: 'bottom 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: '16px 16px 0 0',
          padding: `${spacing.md} ${spacing.md} ${spacing.xl}`,
          maxHeight: keyboardInset > 0 ? `calc(100vh - ${keyboardInset + 24}px)` : '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
          }}
        >
          <span style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
            Đặt mua
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: colors.text.secondary,
              minHeight: 44,
              minWidth: 44,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tóm tắt sản phẩm */}
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            alignItems: 'center',
            padding: spacing.sm,
            backgroundColor: colors.background.secondary,
            borderRadius: 8,
            marginBottom: spacing.md,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: colors.background.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {product.images?.[0]?.startsWith('http') ? (
              <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              cropEmoji(product.cropType)
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: fontSize.body,
                fontWeight: fontWeight.semibold,
                color: colors.text.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {product.name}
            </div>
            <div style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>
              {cropLabel(product.cropType)} · {product.price.toLocaleString('vi-VN')} ₫/{product.unit}
            </div>
            {maxQty != null && (
              <div style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>
                Còn {maxQty} {product.unit}
              </div>
            )}
          </div>
        </div>

        {/* Số lượng */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={labelStyle} htmlFor="order-qty">
            Số lượng ({product.unit})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <button type="button" style={stepBtnStyle} onClick={() => stepQty(-1)} aria-label="Giảm">
              −
            </button>
            <input
              id="order-qty"
              type="text"
              inputMode="decimal"
              value={qtyText}
              onChange={(e) => setQtyText(e.target.value)}
              onFocus={scrollIntoViewOnFocus}
              enterKeyHint="done"
              style={{ ...inputStyle, textAlign: 'center', flex: 1 }}
            />
            <button type="button" style={stepBtnStyle} onClick={() => stepQty(1)} aria-label="Tăng">
              +
            </button>
          </div>
          {qtyError && <div style={errorTextStyle}>{qtyError}</div>}
        </div>

        {/* Đặt cọc (tùy chọn) */}
        <div style={{ marginBottom: spacing.md }}>
          <button
            type="button"
            onClick={() => {
              setDepositEnabled((v) => !v);
              if (depositEnabled) setDepositText('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${depositEnabled ? colors.primary.agriGreen : colors.text.secondary}`,
                backgroundColor: depositEnabled ? colors.primary.agriGreen : 'transparent',
                color: colors.text.inverse,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {depositEnabled ? '✓' : ''}
            </span>
            <span style={{ fontSize: fontSize.body, color: colors.text.primary }}>Đặt cọc trước (tùy chọn)</span>
          </button>

          {depositEnabled && (
            <div style={{ marginTop: spacing.sm }}>
              <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}>
                {DEPOSIT_PERCENTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyDepositPercent(p)}
                    style={{
                      flex: 1,
                      minHeight: 40,
                      borderRadius: 8,
                      border: `1px solid ${colors.primary.zaloBlue}`,
                      backgroundColor: 'transparent',
                      color: colors.primary.zaloBlue,
                      fontSize: fontSize.caption,
                      fontWeight: fontWeight.semibold,
                      cursor: 'pointer',
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={depositText}
                onChange={(e) => setDepositText(e.target.value)}
                onFocus={scrollIntoViewOnFocus}
                enterKeyHint="done"
                placeholder="Số tiền đặt cọc (₫)"
                style={inputStyle}
              />
              {depositError && <div style={errorTextStyle}>{depositError}</div>}
            </div>
          )}
        </div>

        {/* Tổng tiền */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.sm,
            backgroundColor: `${colors.primary.zaloBlue}10`,
            borderRadius: 8,
            marginBottom: spacing.md,
          }}
        >
          <span style={{ fontSize: fontSize.body, color: colors.text.secondary }}>Tổng tiền</span>
          <span style={{ fontSize: fontSize.h1, fontWeight: fontWeight.bold, color: colors.primary.zaloBlue }}>
            {formatVnd(totalPrice)}
          </span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: canSubmit ? colors.primary.agriGreen : colors.text.disabled,
            color: colors.text.inverse,
            border: 'none',
            borderRadius: 8,
            fontSize: fontSize.body,
            fontWeight: fontWeight.semibold,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            minHeight: 48,
          }}
        >
          {submitting ? 'Đang gửi…' : 'Xác nhận đặt mua'}
        </button>

        <p style={{ fontSize: fontSize.caption, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm }}>
          Đơn sẽ được gửi tới thương lái để xác nhận. Bạn có thể hủy khi đơn còn chờ xác nhận.
        </p>
      </div>
    </div>
  );
};

export default BuyerPlaceOrderSheet;
