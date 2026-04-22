/**
 * Buyer Post Buying Request Screen — Phase 10.2 Integration (FR-U02)
 *
 * Màn quản lý nhu cầu mua của người mua:
 * - Danh sách yêu cầu đang mở / đã khớp / đã đóng (loading skeleton + empty state)
 * - Form tạo mới / chỉnh sửa theo bước (4 bước: loại → số lượng & giá → tiêu chuẩn → ngày giao)
 * - Hủy (soft delete) yêu cầu đang 'open'
 *
 * Dữ liệu: buyingRequestService → /api/v1/buying-requests* (Axios + Bearer token)
 * JSON contract: BuyingRequestDto — specs/backend-api-specification/design.md §4.4.2
 * Lỗi: ApiError → toBuyingRequestViMessage → Snackbar tiếng Việt
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listBuyingRequests,
  createBuyingRequest,
  updateBuyingRequest,
  deleteBuyingRequest,
  cropLabelBR,
  standardLabelBR,
  toBuyingRequestViMessage,
  CROP_LABELS_BR,
  STANDARD_LABELS_BR,
  type BuyingRequestDto,
  type CreateBuyingRequestDto,
} from '../../../services/buyingRequestService';

// ── Constants ─────────────────────────────────────────────────────────────────

const CROP_OPTIONS = Object.entries(CROP_LABELS_BR).map(([value, label]) => ({ value, label }));
const STANDARD_OPTIONS = Object.entries(STANDARD_LABELS_BR).map(([value, label]) => ({ value, label }));

// ── Props ─────────────────────────────────────────────────────────────────────

export interface BuyerPostBuyingRequestScreenProps {
  // buyerId lấy từ JWT token phía server; không truyền vào component.
}

// ── Form state type ───────────────────────────────────────────────────────────

interface FormData {
  cropType: string;
  quantity: string;
  unit: 'kg' | 'tấn';
  expectedPrice: string;
  depositOffered: string;
  qualityStandardCode: string;
  deliveryDate: string;
}

const EMPTY_FORM: FormData = {
  cropType: '',
  quantity: '',
  unit: 'kg',
  expectedPrice: '',
  depositOffered: '',
  qualityStandardCode: '',
  deliveryDate: '',
};

type Step = 1 | 2 | 3 | 4;
type ViewMode = 'list' | 'form';

// ── Sub-components ────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      marginBottom: spacing.md,
    }}
  >
    {[80, 60, 50].map((w, i) => (
      <div
        key={i}
        style={{
          height: '12px',
          width: `${w}%`,
          backgroundColor: colors.background.secondary,
          borderRadius: '6px',
          marginBottom: spacing.sm,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    ))}
  </div>
);

// ── Status helpers ────────────────────────────────────────────────────────────

function statusInfo(status: BuyingRequestDto['status']): { label: string; color: string } {
  switch (status) {
    case 'open':
      return { label: 'Đang mở', color: colors.primary.agriGreen };
    case 'matched':
      return { label: 'Đã khớp', color: colors.primary.zaloBlue };
    case 'closed':
      return { label: 'Đã đóng', color: colors.text.secondary };
  }
}

function formatDeliveryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatPrice(price?: number): string {
  if (price === undefined) return '—';
  return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  return `${days} ngày trước`;
}

// ── Buying request card ───────────────────────────────────────────────────────

interface RequestCardProps {
  request: BuyingRequestDto;
  onEdit: (req: BuyingRequestDto) => void;
  onCancel: (id: string) => void;
  cancelling: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onEdit, onCancel, cancelling }) => {
  const si = statusInfo(request.status);
  const cropName = cropLabelBR(request.cropType);
  const standardName = standardLabelBR(request.qualityStandardCode);

  const cardStyle: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    marginBottom: spacing.md,
    opacity: request.status === 'closed' ? 0.65 : 1,
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: `${si.color}18`,
    borderRadius: '6px',
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>
            {cropName}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {relativeTime(request.createdAt)}
          </Text>
        </div>
        <div style={badgeStyle}>
          <Text size="xSmall" style={{ color: si.color, fontWeight: fontWeight.semibold }}>
            {si.label}
          </Text>
        </div>
      </div>

      {/* Details */}
      <div
        style={{
          padding: spacing.sm,
          backgroundColor: colors.background.secondary,
          borderRadius: '8px',
          marginBottom: spacing.sm,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: `${spacing.xs} ${spacing.md}`,
        }}
      >
        <div>
          <Text size="xSmall" style={{ color: colors.text.secondary }}>Số lượng</Text>
          <Text size="small" style={{ fontWeight: fontWeight.medium }}>
            {request.quantity} {request.unit}
          </Text>
        </div>
        <div>
          <Text size="xSmall" style={{ color: colors.text.secondary }}>Giá kỳ vọng</Text>
          <Text size="small" style={{ fontWeight: fontWeight.medium }}>
            {formatPrice(request.expectedPrice)}/{request.unit}
          </Text>
        </div>
        {standardName && (
          <div>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>Tiêu chuẩn</Text>
            <Text size="small" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.medium }}>
              {standardName}
            </Text>
          </div>
        )}
        <div>
          <Text size="xSmall" style={{ color: colors.text.secondary }}>Ngày giao</Text>
          <Text size="small" style={{ fontWeight: fontWeight.medium }}>
            {formatDeliveryDate(request.deliveryDate)}
          </Text>
        </div>
      </div>

      {/* Actions — only for open requests */}
      {request.status === 'open' && (
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            style={{
              flex: 1,
              padding: spacing.sm,
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              border: `1px solid ${colors.background.tertiary}`,
              borderRadius: '8px',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.medium,
              cursor: 'pointer',
            }}
            onClick={() => onEdit(request)}
          >
            Chỉnh sửa
          </button>
          <button
            style={{
              flex: 1,
              padding: spacing.sm,
              backgroundColor: `${colors.functional.alertRed}10`,
              color: colors.functional.alertRed,
              border: `1px solid ${colors.functional.alertRed}30`,
              borderRadius: '8px',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.medium,
              cursor: cancelling ? 'not-allowed' : 'pointer',
              opacity: cancelling ? 0.6 : 1,
            }}
            onClick={() => !cancelling && onCancel(request.id)}
            disabled={cancelling}
          >
            {cancelling ? 'Đang hủy...' : 'Hủy tin'}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const BuyerPostBuyingRequestScreen: React.FC<BuyerPostBuyingRequestScreenProps> = () => {
  const openSnackbar = useStableOpenSnackbar();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingRequest, setEditingRequest] = useState<BuyingRequestDto | null>(null);

  // List state
  const [requests, setRequests] = useState<BuyingRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ── Load buyer's requests ──────────────────────────────────────────────────
  // Server xác định buyer từ Bearer token; buyerId='me' là query hint chuẩn.

  const loadRequests = useCallback(() => {
    setLoading(true);
    setListError(null);
    listBuyingRequests({ buyerId: 'me' })
      .then((res) => {
        setRequests(res.items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = toBuyingRequestViMessage(err, 'list');
        setListError(msg);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingRequest(null);
    setFormData(EMPTY_FORM);
    setCurrentStep(1);
    setViewMode('form');
  };

  const openEditForm = (req: BuyingRequestDto) => {
    setEditingRequest(req);
    // Default deliveryDate to today + 7 if missing
    const deliveryDateValue = req.deliveryDate
      ? req.deliveryDate.slice(0, 10)
      : '';
    setFormData({
      cropType: req.cropType,
      quantity: String(req.quantity),
      unit: (req.unit as 'kg' | 'tấn') ?? 'kg',
      expectedPrice: req.expectedPrice !== undefined ? String(req.expectedPrice) : '',
      depositOffered: req.depositOffered !== undefined ? String(req.depositOffered) : '',
      qualityStandardCode: req.qualityStandardCode ?? '',
      deliveryDate: deliveryDateValue,
    });
    setCurrentStep(1);
    setViewMode('form');
  };

  const closeForm = () => {
    setViewMode('list');
    setEditingRequest(null);
    setFormData(EMPTY_FORM);
    setCurrentStep(1);
  };

  // ── Cancel request ──────────────────────────────────────────────────────────

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await deleteBuyingRequest(id);
      // Soft delete: server đổi status → 'closed'; phản ánh ngay trên UI
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'closed' as const } : r)),
      );
      openSnackbar({ type: 'success', text: 'Đã hủy tin thành công.', duration: 3000, icon: true });
    } catch (err: unknown) {
      openSnackbar({
        type: 'error',
        text: toBuyingRequestViMessage(err, 'delete'),
        duration: 4000,
        icon: true,
      });
    } finally {
      setCancellingId(null);
    }
  };

  // ── Step validation ─────────────────────────────────────────────────────────

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.cropType !== '';
      case 2:
        return (
          parseFloat(formData.quantity) > 0 &&
          (formData.expectedPrice === '' || parseFloat(formData.expectedPrice) > 0)
        );
      case 3:
        return true; // Standard is optional
      case 4:
        return formData.deliveryDate !== '';
      default:
        return false;
    }
  };

  // ── Form submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    const body: CreateBuyingRequestDto = {
      cropType: formData.cropType,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      qualityStandardCode: formData.qualityStandardCode || undefined,
      expectedPrice: formData.expectedPrice ? parseFloat(formData.expectedPrice) : undefined,
      depositOffered: formData.depositOffered ? parseFloat(formData.depositOffered) : undefined,
      deliveryDate: new Date(formData.deliveryDate).toISOString(),
    };

    try {
      if (editingRequest) {
        // PUT /api/v1/buying-requests/:id — buyerId validated by server via token
        const updated = await updateBuyingRequest(editingRequest.id, body);
        setRequests((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
        openSnackbar({ type: 'success', text: 'Cập nhật tin thành công!', duration: 3000, icon: true });
      } else {
        // POST /api/v1/buying-requests — server gán buyerId từ Bearer token
        const created = await createBuyingRequest(body);
        setRequests((prev) => [created, ...prev]);
        openSnackbar({ type: 'success', text: 'Đăng tin thành công!', duration: 3000, icon: true });
      }
      closeForm();
    } catch (err: unknown) {
      const context = editingRequest ? 'update' : 'create';
      openSnackbar({
        type: 'error',
        text: toBuyingRequestViMessage(err, context),
        duration: 4000,
        icon: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const headerStyle: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const primaryBtnStyle = (disabled = false): React.CSSProperties => ({
    width: '100%',
    padding: spacing.md,
    backgroundColor: disabled ? colors.background.tertiary : colors.primary.zaloBlue,
    color: disabled ? colors.text.disabled : colors.text.inverse,
    border: 'none',
    borderRadius: '10px',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '8px',
    fontSize: fontSize.body,
    color: colors.text.primary,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: '6px',
    display: 'block',
  };

  // ── List view ───────────────────────────────────────────────────────────────

  const renderList = () => {
    const openRequests = requests.filter((r) => r.status === 'open');
    const otherRequests = requests.filter((r) => r.status !== 'open');

    return (
      <RoleAppShell role="buyer" className="buyer-post-buying-request-screen">
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              Nhu cầu mua
            </Text>
            <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
              Tin đăng của tôi
            </Text.Title>
          </div>
        </div>

        <div style={{ padding: spacing.md, paddingBottom: '100px' }}>
          {/* New request CTA */}
          <button
            style={{
              ...primaryBtnStyle(),
              marginBottom: spacing.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}
            onClick={openCreateForm}
          >
            <Icon name="add" size="sm" color={colors.text.inverse} />
            Đăng nhu cầu mua mới
          </button>

          {/* Loading skeleton */}
          {loading && (
            <div>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error state */}
          {!loading && listError && (
            <div style={{ textAlign: 'center', padding: spacing.lg }}>
              <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
              <Text size="small" style={{ color: colors.functional.alertRed }}>
                {listError}
              </Text>
              <button
                style={{ ...primaryBtnStyle(), marginTop: spacing.md, width: 'auto', padding: `${spacing.sm} ${spacing.lg}` }}
                onClick={loadRequests}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !listError && requests.length === 0 && (
            <div style={{ textAlign: 'center', padding: spacing.xl }}>
              <div style={{ fontSize: '56px', marginBottom: spacing.md }}>🛒</div>
              <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
                Chưa có tin đăng nào
              </Text.Title>
              <Text size="small" style={{ color: colors.text.secondary }}>
                Đăng nhu cầu mua để thương lái liên hệ với bạn
              </Text>
            </div>
          )}

          {/* Active / open requests */}
          {!loading && !listError && openRequests.length > 0 && (
            <div>
              <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
                Đang mở ({openRequests.length})
              </Text.Title>
              {openRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onEdit={openEditForm}
                  onCancel={handleCancel}
                  cancelling={cancellingId === r.id}
                />
              ))}
            </div>
          )}

          {/* History */}
          {!loading && !listError && otherRequests.length > 0 && (
            <div style={{ marginTop: spacing.md }}>
              <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
                Lịch sử ({otherRequests.length})
              </Text.Title>
              {otherRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onEdit={openEditForm}
                  onCancel={handleCancel}
                  cancelling={cancellingId === r.id}
                />
              ))}
            </div>
          )}
        </div>
      </RoleAppShell>
    );
  };

  // ── Form step renders ───────────────────────────────────────────────────────

  const stepTitleStyle: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 style={stepTitleStyle}>Bước 1: Chọn loại nông sản</h2>
            <label style={labelStyle}>Loại nông sản bạn muốn mua *</label>
            <select
              style={{ ...inputStyle, marginBottom: spacing.md }}
              value={formData.cropType}
              onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
            >
              <option value="">-- Chọn loại nông sản --</option>
              {CROP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
            <h2 style={stepTitleStyle}>Bước 2: Số lượng và giá</h2>

            <label style={labelStyle}>Số lượng cần mua *</label>
            <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
              <input
                type="number"
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Nhập số lượng"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="0"
                step="1"
              />
              <select
                style={{ ...inputStyle, width: '90px' }}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'kg' | 'tấn' })}
              >
                <option value="kg">kg</option>
                <option value="tấn">tấn</option>
              </select>
            </div>

            <label style={labelStyle}>Giá kỳ vọng (VNĐ/{formData.unit})</label>
            <input
              type="number"
              style={{ ...inputStyle, marginBottom: spacing.md }}
              placeholder="VD: 120000"
              value={formData.expectedPrice}
              onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
              min="0"
              step="1000"
            />

            <label style={labelStyle}>Tiền cọc sẵn sàng (VNĐ, không bắt buộc)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="VD: 5000000"
              value={formData.depositOffered}
              onChange={(e) => setFormData({ ...formData, depositOffered: e.target.value })}
              min="0"
              step="100000"
            />
            <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
              💡 Đặt cọc trước giúp thương lái ưu tiên bạn
            </Text>
          </div>
        );

      case 3: {
        return (
          <div>
            <h2 style={stepTitleStyle}>Bước 3: Tiêu chuẩn chất lượng</h2>
            <label style={labelStyle}>Chọn tiêu chuẩn (tùy chọn)</label>
            <select
              style={{ ...inputStyle, marginBottom: spacing.md }}
              value={formData.qualityStandardCode}
              onChange={(e) => setFormData({ ...formData, qualityStandardCode: e.target.value })}
            >
              <option value="">-- Không yêu cầu tiêu chuẩn cụ thể --</option>
              {STANDARD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              💡 Yêu cầu tiêu chuẩn giúp đảm bảo chất lượng nông sản
            </Text>
          </div>
        );
      }

      case 4: {
        // Summary + delivery date
        const cropName = cropLabelBR(formData.cropType);
        const stdName = standardLabelBR(formData.qualityStandardCode);
        return (
          <div>
            <h2 style={stepTitleStyle}>Bước 4: Ngày giao hàng</h2>
            <label style={labelStyle}>Ngày giao hàng kỳ vọng *</label>
            <input
              type="date"
              style={{ ...inputStyle, marginBottom: spacing.lg }}
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              min={new Date().toISOString().slice(0, 10)}
            />

            {/* Summary */}
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.background.secondary,
                borderRadius: '10px',
                borderLeft: `4px solid ${colors.primary.zaloBlue}`,
              }}
            >
              <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
                Tóm tắt yêu cầu
              </Text.Title>
              {[
                { label: 'Nông sản', value: cropName },
                { label: 'Số lượng', value: `${formData.quantity} ${formData.unit}` },
                { label: 'Giá kỳ vọng', value: formData.expectedPrice ? `${parseInt(formData.expectedPrice, 10).toLocaleString('vi-VN')} VNĐ/${formData.unit}` : '—' },
                { label: 'Tiêu chuẩn', value: stdName ?? 'Không yêu cầu' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}
                >
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>{label}</Text>
                  <Text size="xSmall" style={{ fontWeight: fontWeight.medium }}>{value}</Text>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ── Form view ───────────────────────────────────────────────────────────────

  const renderForm = () => (
    <RoleAppShell role="buyer" className="buyer-post-buying-request-form">
      {/* Header */}
      <div style={headerStyle}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing.xs }}
          onClick={closeForm}
          aria-label="Quay lại"
        >
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </button>
        <div>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {editingRequest ? 'Chỉnh sửa tin' : 'Đăng tin mới'}
          </Text>
          <Text.Title size="small" style={{ margin: 0 }}>
            Nhu cầu mua
          </Text.Title>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: `${spacing.sm} ${spacing.md}`, backgroundColor: colors.background.primary }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
          {([1, 2, 3, 4] as Step[]).map((step) => (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: step <= currentStep ? colors.primary.zaloBlue : colors.background.tertiary,
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>
        <Text size="xSmall" style={{ color: colors.text.secondary, textAlign: 'center' }}>
          Bước {currentStep} / 4
        </Text>
      </div>

      {/* Step content */}
      <div style={{ padding: spacing.md, paddingBottom: '90px' }}>
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderTop: `1px solid ${colors.background.secondary}`,
          display: 'flex',
          gap: spacing.sm,
        }}
      >
        {currentStep > 1 && (
          <button
            style={{
              flex: 1,
              padding: spacing.md,
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              border: `1px solid ${colors.background.tertiary}`,
              borderRadius: '10px',
              fontSize: fontSize.body,
              fontWeight: fontWeight.medium,
              cursor: 'pointer',
            }}
            onClick={() => setCurrentStep((s) => (s - 1) as Step)}
          >
            ← Quay lại
          </button>
        )}
        {currentStep < 4 ? (
          <button
            style={primaryBtnStyle(!isStepValid())}
            onClick={() => setCurrentStep((s) => (s + 1) as Step)}
            disabled={!isStepValid()}
          >
            Tiếp theo →
          </button>
        ) : (
          <button
            style={primaryBtnStyle(!isStepValid() || submitting)}
            onClick={handleSubmit}
            disabled={!isStepValid() || submitting}
          >
            {submitting
              ? 'Đang đăng...'
              : editingRequest
              ? 'Lưu thay đổi'
              : 'Đăng tin ngay'}
          </button>
        )}
      </div>
    </RoleAppShell>
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  return viewMode === 'list' ? renderList() : renderForm();
};

export default BuyerPostBuyingRequestScreen;
