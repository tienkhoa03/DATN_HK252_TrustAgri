/**
 * Buyer Post Buying Request Screen
 * Đăng nhu cầu mua - Chủ động tìm nguồn hàng theo ý muốn
 * 
 * Requirements: FR-U02, US-U04
 * 
 * Features:
 * - Form nhập liệu theo từng bước (Step-by-step)
 * - Bước 1: Chọn loại nông sản (Dropdown)
 * - Bước 2: Nhập số lượng (kg/tấn) và Khoảng giá mong muốn
 * - Bước 3: Chọn tiêu chuẩn (VietGAP, GlobalGAP, Hữu cơ)
 * - Bước 4: Mô tả chi tiết
 * - Nút Đăng tin: Nút lớn màu Zalo Blue ở cuối form
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface BuyerPostBuyingRequestScreenProps {
  buyerName?: string;
  onSubmit?: (request: BuyingRequest) => void;
  onCancel?: () => void;
}

export interface BuyingRequest {
  productType: string;
  quantity: number;
  unit: 'kg' | 'tấn';
  priceMin: number;
  priceMax: number;
  standards: string[];
  description: string;
}

type Step = 1 | 2 | 3 | 4;

/**
 * Buyer Post Buying Request Screen Component
 * Requirements: FR-U02, US-U04
 */
export const BuyerPostBuyingRequestScreen: React.FC<BuyerPostBuyingRequestScreenProps> = ({
  buyerName = 'Người mua',
  onSubmit,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<BuyingRequest>({
    productType: '',
    quantity: 0,
    unit: 'kg',
    priceMin: 0,
    priceMax: 0,
    standards: [],
    description: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Product types - Loại nông sản
  const productTypes = [
    'Bưởi Da Xanh',
    'Sầu riêng Monthong',
    'Xoài Cát Chu',
    'Thanh Long Ruột Đỏ',
    'Cam Sành',
    'Nhãn Lồng',
    'Chuối Già',
    'Dừa Xiêm',
    'Khác',
  ];

  // Standards - Tiêu chuẩn
  const standardOptions = [
    { value: 'VietGAP', label: 'VietGAP' },
    { value: 'GlobalGAP', label: 'GlobalGAP' },
    { value: 'Organic', label: 'Hữu cơ' },
    { value: 'OCOP', label: 'OCOP' },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData);
    }
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setFormData({
        productType: '',
        quantity: 0,
        unit: 'kg',
        priceMin: 0,
        priceMax: 0,
        standards: [],
        description: '',
      });
      setCurrentStep(1);
    }, 2000);
  };

  const toggleStandard = (standard: string) => {
    setFormData((prev) => ({
      ...prev,
      standards: prev.standards.includes(standard)
        ? prev.standards.filter((s) => s !== standard)
        : [...prev.standards, standard],
    }));
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.productType !== '';
      case 2:
        return formData.quantity > 0 && formData.priceMin > 0 && formData.priceMax > 0;
      case 3:
        return formData.standards.length > 0;
      case 4:
        return formData.description.trim().length > 0;
      default:
        return false;
    }
  };

  // Styles
  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const progressBarContainerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  };

  const progressBarStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  };

  const progressStepStyles = (step: number): React.CSSProperties => ({
    flex: 1,
    height: '4px',
    backgroundColor: step <= currentStep ? colors.primary.zaloBlue : colors.background.tertiary,
    borderRadius: '2px',
    transition: 'background-color 0.3s',
  });

  const stepLabelStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  };

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    minHeight: '400px',
  };

  const stepTitleStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    display: 'block',
  };

  const selectStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    color: colors.text.primary,
    marginBottom: spacing.md,
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    color: colors.text.primary,
    marginBottom: spacing.md,
  };

  const inputGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginBottom: spacing.md,
  };

  const inputWithUnitStyles: React.CSSProperties = {
    flex: 1,
  };

  const unitSelectStyles: React.CSSProperties = {
    width: '100px',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    color: colors.text.primary,
  };

  const standardGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.sm,
    marginBottom: spacing.md,
  };

  const standardButtonStyles = (selected: boolean): React.CSSProperties => ({
    padding: spacing.md,
    backgroundColor: selected ? colors.primary.zaloBlue : colors.background.secondary,
    color: selected ? colors.text.inverse : colors.text.primary,
    border: selected ? `2px solid ${colors.primary.zaloBlue}` : `2px solid ${colors.background.tertiary}`,
    borderRadius: '8px',
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  });

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '120px',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    color: colors.text.primary,
    resize: 'vertical',
    fontFamily: 'inherit',
  };

  const navigationButtonsStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderTop: `1px solid ${colors.background.secondary}`,
    display: 'flex',
    gap: spacing.sm,
  };

  const buttonStyles = (variant: 'primary' | 'secondary', disabled: boolean = false): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: disabled
      ? colors.background.tertiary
      : variant === 'primary'
      ? colors.primary.zaloBlue
      : colors.background.secondary,
    color: disabled ? colors.text.disabled : variant === 'primary' ? colors.text.inverse : colors.text.primary,
    border: variant === 'secondary' ? `1px solid ${colors.background.tertiary}` : 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
  });

  const successOverlayStyles: React.CSSProperties = {
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
  };

  const successCardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '16px',
    padding: spacing.xl,
    textAlign: 'center',
    maxWidth: '300px',
    margin: spacing.md,
  };

  const successIconStyles: React.CSSProperties = {
    fontSize: '64px',
    marginBottom: spacing.md,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 style={stepTitleStyles}>Bước 1: Chọn loại nông sản</h2>
            <label style={labelStyles}>Loại nông sản bạn muốn mua</label>
            <select
              style={selectStyles}
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
            >
              <option value="">-- Chọn loại nông sản --</option>
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              💡 Chọn loại nông sản bạn đang tìm kiếm
            </Text>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={stepTitleStyles}>Bước 2: Số lượng và giá</h2>
            
            <label style={labelStyles}>Số lượng cần mua</label>
            <div style={inputGroupStyles}>
              <input
                type="number"
                style={{ ...inputStyles, ...inputWithUnitStyles, marginBottom: 0 }}
                placeholder="Nhập số lượng"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.1"
              />
              <select
                style={unitSelectStyles}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'kg' | 'tấn' })}
              >
                <option value="kg">kg</option>
                <option value="tấn">tấn</option>
              </select>
            </div>

            <label style={labelStyles}>Khoảng giá mong muốn (VNĐ/{formData.unit})</label>
            <div style={inputGroupStyles}>
              <input
                type="number"
                style={{ ...inputStyles, flex: 1, marginBottom: 0 }}
                placeholder="Giá tối thiểu"
                value={formData.priceMin || ''}
                onChange={(e) => setFormData({ ...formData, priceMin: parseFloat(e.target.value) || 0 })}
                min="0"
                step="1000"
              />
              <span style={{ display: 'flex', alignItems: 'center', padding: `0 ${spacing.sm}` }}>-</span>
              <input
                type="number"
                style={{ ...inputStyles, flex: 1, marginBottom: 0 }}
                placeholder="Giá tối đa"
                value={formData.priceMax || ''}
                onChange={(e) => setFormData({ ...formData, priceMax: parseFloat(e.target.value) || 0 })}
                min="0"
                step="1000"
              />
            </div>

            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              💡 Nhập khoảng giá bạn sẵn sàng trả
            </Text>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={stepTitleStyles}>Bước 3: Chọn tiêu chuẩn</h2>
            <label style={labelStyles}>Tiêu chuẩn chất lượng yêu cầu (có thể chọn nhiều)</label>
            <div style={standardGridStyles}>
              {standardOptions.map((option) => (
                <button
                  key={option.value}
                  style={standardButtonStyles(formData.standards.includes(option.value))}
                  onClick={() => toggleStandard(option.value)}
                  onMouseEnter={(e) => {
                    if (!formData.standards.includes(option.value)) {
                      e.currentTarget.style.borderColor = colors.primary.zaloBlue;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.standards.includes(option.value)) {
                      e.currentTarget.style.borderColor = colors.background.tertiary;
                    }
                  }}
                >
                  {formData.standards.includes(option.value) && '✓ '}
                  {option.label}
                </button>
              ))}
            </div>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              💡 Chọn các tiêu chuẩn chất lượng bạn yêu cầu
            </Text>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 style={stepTitleStyles}>Bước 4: Mô tả chi tiết</h2>
            <label style={labelStyles}>Mô tả yêu cầu cụ thể</label>
            <textarea
              style={textareaStyles}
              placeholder="VD: Bưởi size lớn, vỏ xanh không sẹo, độ ngọt trên 12 Brix..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              💡 Mô tả chi tiết giúp thương lái hiểu rõ nhu cầu của bạn
            </Text>

            {/* Summary */}
            <div
              style={{
                marginTop: spacing.lg,
                padding: spacing.md,
                backgroundColor: colors.background.secondary,
                borderRadius: '8px',
              }}
            >
              <Text.Title size="small" style={{ marginBottom: spacing.sm, fontWeight: fontWeight.semibold }}>
                Tóm tắt yêu cầu
              </Text.Title>
              <Text size="xSmall" style={{ marginBottom: spacing.xs }}>
                <strong>Nông sản:</strong> {formData.productType}
              </Text>
              <Text size="xSmall" style={{ marginBottom: spacing.xs }}>
                <strong>Số lượng:</strong> {formData.quantity} {formData.unit}
              </Text>
              <Text size="xSmall" style={{ marginBottom: spacing.xs }}>
                <strong>Giá:</strong> {formData.priceMin.toLocaleString()} - {formData.priceMax.toLocaleString()} VNĐ/{formData.unit}
              </Text>
              <Text size="xSmall">
                <strong>Tiêu chuẩn:</strong> {formData.standards.join(', ')}
              </Text>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Page className="buyer-post-buying-request-screen">
      {/* Header */}
      <div style={headerStyles}>
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Đăng nhu cầu mua
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          Tìm nguồn hàng phù hợp
        </Text.Title>
      </div>

      {/* Progress Bar */}
      <div style={progressBarContainerStyles}>
        <div style={progressBarStyles}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} style={progressStepStyles(step)} />
          ))}
        </div>
        <div style={stepLabelStyles}>
          Bước {currentStep} / 4
        </div>
      </div>

      {/* Content */}
      <div style={{ ...contentStyles, paddingBottom: '80px' }}>
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div style={navigationButtonsStyles}>
        {currentStep > 1 && (
          <button
            style={buttonStyles('secondary', false)}
            onClick={handleBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
          >
            ← Quay lại
          </button>
        )}
        {currentStep < 4 ? (
          <button
            style={buttonStyles('primary', !isStepValid())}
            onClick={handleNext}
            disabled={!isStepValid()}
            onMouseEnter={(e) => {
              if (isStepValid()) {
                e.currentTarget.style.backgroundColor = '#0052CC';
              }
            }}
            onMouseLeave={(e) => {
              if (isStepValid()) {
                e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              }
            }}
          >
            Tiếp theo →
          </button>
        ) : (
          <button
            style={buttonStyles('primary', !isStepValid())}
            onClick={handleSubmit}
            disabled={!isStepValid()}
            onMouseEnter={(e) => {
              if (isStepValid()) {
                e.currentTarget.style.backgroundColor = '#0052CC';
              }
            }}
            onMouseLeave={(e) => {
              if (isStepValid()) {
                e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              }
            }}
          >
            Đăng tin ngay
          </button>
        )}
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div style={successOverlayStyles}>
          <div style={successCardStyles}>
            <div style={successIconStyles}>✅</div>
            <Text.Title size="normal" style={{ marginBottom: spacing.sm, fontWeight: fontWeight.semibold }}>
              Đăng tin thành công!
            </Text.Title>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Yêu cầu của bạn đã được gửi đến các thương lái
            </Text>
          </div>
        </div>
      )}
    </Page>
  );
};

export default BuyerPostBuyingRequestScreen;
