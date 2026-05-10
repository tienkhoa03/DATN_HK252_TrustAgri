/**
 * CreateBuyingRequestStepper — 3-step form to create a buying request
 *
 * Requirements: FR-U02, FR-U03, NFR-U01, NFR-U03
 */

import React from 'react';
import { Text } from 'zmp-ui';
import { StepperForm, type StepConfig } from './StepperForm';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  createBuyingRequest,
  toBuyingRequestViMessage,
  type CreateBuyingRequestDto,
} from '@/services/buyingRequestService';

export interface CreateBuyingRequestStepperProps {
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

// ── Per-step state shapes ────────────────────────────────────────────────────

interface Step1State {
  cropType: string;
  quantity: string;
  unit: 'kg' | 'tấn';
}

interface Step2State {
  standards: string[];
  notes: string;
}

interface Step3State {
  expectedPrice: string;
  depositAmount: string;
  deliveryDate: string;
}

type FormState = Step1State & Step2State & Step3State;

const INITIAL_STATE: FormState = {
  cropType: '',
  quantity: '',
  unit: 'kg',
  standards: [],
  notes: '',
  expectedPrice: '',
  depositAmount: '',
  deliveryDate: '',
};

const STANDARD_OPTIONS = ['VietGAP', 'GlobalGAP', 'Hữu cơ'];

// ── Shared input styles ──────────────────────────────────────────────────────

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: fontSize.caption,
  fontWeight: fontWeight.medium,
  color: colors.text.primary,
  marginBottom: spacing.xs,
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  minHeight: '44px',
  padding: `0 ${spacing.md}`,
  border: `1px solid ${colors.background.tertiary}`,
  borderRadius: '8px',
  fontSize: fontSize.caption,
  backgroundColor: colors.background.primary,
  color: colors.text.primary,
  outline: 'none',
  boxSizing: 'border-box',
};

const fieldGroupStyles: React.CSSProperties = {
  marginBottom: spacing.md,
};

// ── Step renderers ───────────────────────────────────────────────────────────

function renderStep1(
  state: FormState,
  setState: React.Dispatch<React.SetStateAction<FormState>>,
): React.ReactNode {
  return (
    <div>
      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Loại nông sản *</label>
        <input
          type="text"
          style={inputStyles}
          placeholder="Ví dụ: Thanh long, Xoài..."
          value={state.cropType}
          onChange={(e) => setState((s) => ({ ...s, cropType: e.target.value }))}
        />
      </div>

      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Số lượng *</label>
        <input
          type="number"
          style={inputStyles}
          placeholder="0"
          min={0}
          value={state.quantity}
          onChange={(e) => setState((s) => ({ ...s, quantity: e.target.value }))}
        />
      </div>

      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Đơn vị</label>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {(['kg', 'tấn'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setState((s) => ({ ...s, unit: u }))}
              style={{
                flex: 1,
                minHeight: '44px',
                borderRadius: '8px',
                border: `2px solid ${state.unit === u ? colors.primary.agriGreen : colors.background.tertiary}`,
                backgroundColor: state.unit === u ? 'rgba(62,187,108,0.1)' : colors.background.primary,
                color: state.unit === u ? colors.primary.agriGreen : colors.text.primary,
                fontSize: fontSize.caption,
                fontWeight: state.unit === u ? fontWeight.semibold : fontWeight.regular,
                cursor: 'pointer',
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderStep2(
  state: FormState,
  setState: React.Dispatch<React.SetStateAction<FormState>>,
): React.ReactNode {
  const toggle = (std: string) => {
    setState((s) => ({
      ...s,
      standards: s.standards.includes(std)
        ? s.standards.filter((x) => x !== std)
        : [...s.standards, std],
    }));
  };

  return (
    <div>
      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Tiêu chuẩn chất lượng</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {STANDARD_OPTIONS.map((std) => {
            const checked = state.standards.includes(std);
            return (
              <button
                key={std}
                type="button"
                onClick={() => toggle(std)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  minHeight: '44px',
                  padding: `0 ${spacing.md}`,
                  borderRadius: '8px',
                  border: `2px solid ${checked ? colors.primary.agriGreen : colors.background.tertiary}`,
                  backgroundColor: checked ? 'rgba(62,187,108,0.08)' : colors.background.primary,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: `2px solid ${checked ? colors.primary.agriGreen : colors.background.tertiary}`,
                  backgroundColor: checked ? colors.primary.agriGreen : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {checked && <span style={{ color: colors.text.inverse, fontSize: '12px' }}>✓</span>}
                </div>
                <Text style={{ fontSize: fontSize.caption, color: colors.text.primary, margin: 0 }}>
                  {std}
                </Text>
              </button>
            );
          })}
        </div>
      </div>

      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Yêu cầu khác</label>
        <textarea
          style={{
            ...inputStyles,
            minHeight: '96px',
            padding: spacing.md,
            resize: 'vertical',
          }}
          placeholder="Ghi chú thêm về yêu cầu chất lượng..."
          value={state.notes}
          onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
        />
      </div>
    </div>
  );
}

function renderStep3(
  state: FormState,
  setState: React.Dispatch<React.SetStateAction<FormState>>,
): React.ReactNode {
  return (
    <div>
      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Giá kỳ vọng (VNĐ/kg) *</label>
        <input
          type="number"
          style={inputStyles}
          placeholder="0"
          min={0}
          value={state.expectedPrice}
          onChange={(e) => setState((s) => ({ ...s, expectedPrice: e.target.value }))}
        />
      </div>

      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Tiền cọc (VNĐ)</label>
        <input
          type="number"
          style={inputStyles}
          placeholder="0"
          min={0}
          value={state.depositAmount}
          onChange={(e) => setState((s) => ({ ...s, depositAmount: e.target.value }))}
        />
      </div>

      <div style={fieldGroupStyles}>
        <label style={labelStyles}>Ngày giao hàng *</label>
        <input
          type="date"
          style={inputStyles}
          value={state.deliveryDate}
          onChange={(e) => setState((s) => ({ ...s, deliveryDate: e.target.value }))}
        />
      </div>
    </div>
  );
}

// ── Validators ───────────────────────────────────────────────────────────────

function validateStep1(state: FormState): string | null {
  if (!state.cropType.trim()) return 'Vui lòng nhập loại nông sản.';
  const qty = parseFloat(state.quantity);
  if (isNaN(qty) || qty <= 0) return 'Số lượng phải lớn hơn 0.';
  return null;
}

function validateStep3(state: FormState): string | null {
  const price = parseFloat(state.expectedPrice);
  if (isNaN(price) || price <= 0) return 'Vui lòng nhập giá kỳ vọng.';
  if (!state.deliveryDate) return 'Vui lòng chọn ngày giao hàng.';
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

export const CreateBuyingRequestStepper: React.FC<CreateBuyingRequestStepperProps> = ({
  onSuccess,
  onCancel,
}) => {
  const openSnackbar = useStableOpenSnackbar();

  const steps: StepConfig<FormState>[] = [
    {
      id: 'basic',
      title: 'Thông tin cơ bản',
      render: renderStep1,
      validate: validateStep1,
    },
    {
      id: 'standards',
      title: 'Tiêu chuẩn & Yêu cầu',
      render: renderStep2,
    },
    {
      id: 'terms',
      title: 'Giá & Thời gian',
      render: renderStep3,
      validate: validateStep3,
    },
  ];

  const handleSubmit = async (state: FormState) => {
    const body: CreateBuyingRequestDto = {
      cropType: state.cropType.trim(),
      quantity: parseFloat(state.quantity),
      unit: state.unit,
      qualityStandardCode: state.standards[0],
      expectedPrice: state.expectedPrice ? parseFloat(state.expectedPrice) : undefined,
      depositOffered: state.depositAmount ? parseFloat(state.depositAmount) : undefined,
      deliveryDate: state.deliveryDate,
    };

    try {
      const created = await createBuyingRequest(body);
      openSnackbar({ text: 'Đã gửi nhu cầu mua hàng!', type: 'success' });
      onSuccess?.(created.id);
    } catch (err) {
      const msg = toBuyingRequestViMessage(err, 'create');
      openSnackbar({ text: msg, type: 'error', duration: 4000 });
    }
  };

  return (
    <StepperForm<FormState>
      steps={steps}
      initialState={INITIAL_STATE}
      onSubmit={handleSubmit}
      draftKey="buyer-create-request-draft"
      onCancel={onCancel}
    />
  );
};
