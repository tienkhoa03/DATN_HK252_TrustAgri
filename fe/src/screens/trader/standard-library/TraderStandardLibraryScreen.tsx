/**
 * Trader Standard Library Screen — Phase 4.2 Integration (FR-T10, US-T02)
 *
 * Gọi thực tế: GET|POST|PUT|DELETE /api/v1/standards* qua useStandards hook.
 *
 * - Skeleton loading khi tải danh sách
 * - Empty state khi chưa có quy trình nào
 * - CRUD đầy đủ (list / detail / create / edit / delete) — chỉ trader
 * - Lỗi hiển thị qua Snackbar ZMP-UI tiếng Việt
 * - 403 FORBIDDEN xử lý rõ ràng khi không phải trader / owner
 * - Role-guard: nút tạo / sửa / xóa chỉ hiện với role=trader
 *
 * ZMP SDK:
 *   - Token đã trao đổi ở Phase 1; interceptor tự gắn Authorization: Bearer.
 *   - Không gọi thêm ZMP SDK trong màn này.
 *
 * DTO mapping (design.md §4.3 §1.1):
 *   - Backend trả camelCase → standardService map 1-1 → không cần mapper thêm.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'zmp-ui';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { useAtomValue } from 'jotai';
import { currentRoleAtom } from '@/state/authAtoms';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useStandards } from '@/hooks/useStandards';
import type { StandardDto, StandardStepDto, CreateStandardDto, UpdateStandardDto } from '@/hooks/useStandards';

// ── View states ───────────────────────────────────────────────────────────────

type View = 'list' | 'detail' | 'form';

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: '8px',
      border: `1px solid ${colors.background.tertiary}`,
      marginBottom: spacing.md,
    }}
    aria-hidden="true"
  >
    {[100, 60, 80].map((w, i) => (
      <div
        key={i}
        style={{
          height: i === 0 ? '18px' : '12px',
          width: `${w}%`,
          backgroundColor: colors.background.secondary,
          borderRadius: '4px',
          marginBottom: spacing.sm,
        }}
      />
    ))}
  </div>
);

// ── Step form helper types ────────────────────────────────────────────────────

interface StepFormItem {
  id: string;
  order: number;
  title: string;
  description: string;
  expectedDurationDays: string;
  acceptanceCriteria: string;
}

function stepDtoToForm(s: StandardStepDto): StepFormItem {
  return {
    id: s.id,
    order: s.order,
    title: s.title,
    description: s.description,
    expectedDurationDays: s.expectedDurationDays?.toString() ?? '',
    acceptanceCriteria: s.acceptanceCriteria ?? '',
  };
}

function formToStepDto(s: StepFormItem): StandardStepDto {
  return {
    id: s.id,
    order: s.order,
    title: s.title,
    description: s.description,
    expectedDurationDays: s.expectedDurationDays ? Number(s.expectedDurationDays) : undefined,
    acceptanceCriteria: s.acceptanceCriteria || undefined,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export const TraderStandardLibraryScreen: React.FC = () => {
  const role = useAtomValue(currentRoleAtom);
  const isTrader = role === 'trader';

  const {
    standards,
    isLoading,
    isMutating,
    error,
    clearError,
    loadStandards,
    getStandard,
    createStandard,
    updateStandard,
    removeStandard,
  } = useStandards();

  const openSnackbar = useStableOpenSnackbar();

  // ── Snackbar on error ──────────────────────────────────────────────────────

  useEffect(() => {
    if (error) {
      openSnackbar({ text: error, type: 'error', duration: 4000 });
      clearError();
    }
  }, [error, openSnackbar, clearError]);

  // ── View + detail state ────────────────────────────────────────────────────

  const [view, setView] = useState<View>('list');
  const [detail, setDetail] = useState<StandardDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const loadedRef = useRef(false);

  // ── Form state ──────────────────────────────────────────────────────────────

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSteps, setFormSteps] = useState<StepFormItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadStandards({ page: 1, limit: 20 });
  }, [loadStandards]);

  // ── Detail ──────────────────────────────────────────────────────────────────

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setView('detail');
    setDetail(null);
    const s = await getStandard(id);
    if (s) setDetail(s);
    else setView('list');
    setDetailLoading(false);
  }, [getStandard]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    if (!isTrader) {
      openSnackbar({ text: 'Chỉ thương lái mới có thể tạo quy trình canh tác.', type: 'error', duration: 3000 });
      return;
    }
    setEditingId(null);
    setFormCode('');
    setFormName('');
    setFormDesc('');
    setFormSteps([]);
    setFormError(null);
    setView('form');
  };

  const openEdit = (s: StandardDto) => {
    if (!isTrader) return;
    setEditingId(s.id);
    setFormCode(s.code);
    setFormName(s.name);
    setFormDesc(s.description);
    setFormSteps(s.steps.map(stepDtoToForm));
    setFormError(null);
    setView('form');
  };

  const addStep = () => {
    const nextOrder = formSteps.length + 1;
    setFormSteps((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, order: nextOrder, title: '', description: '', expectedDurationDays: '', acceptanceCriteria: '' },
    ]);
  };

  const updateStep = (idx: number, field: keyof StepFormItem, value: string) => {
    setFormSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeStep = (idx: number) => {
    setFormSteps((prev) =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })),
    );
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formCode.trim() || !formName.trim()) {
      setFormError('Mã và tên quy trình là bắt buộc.');
      return;
    }
    setFormError(null);

    const body: CreateStandardDto | UpdateStandardDto = {
      code: formCode.trim(),
      name: formName.trim(),
      description: formDesc.trim(),
      steps: formSteps.map(formToStepDto),
    };

    if (editingId) {
      const updated = await updateStandard(editingId, body as UpdateStandardDto);
      if (updated) {
        setDetail(updated);
        setView('detail');
        openSnackbar({ text: 'Đã cập nhật quy trình thành công.', type: 'success', duration: 2500 });
      }
    } else {
      const created = await createStandard(body as CreateStandardDto);
      if (created) {
        setView('list');
        openSnackbar({ text: 'Đã tạo quy trình mới thành công.', type: 'success', duration: 2500 });
      }
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const ok = await removeStandard(id);
    if (ok) {
      setView('list');
      openSnackbar({ text: 'Đã xóa quy trình.', type: 'success', duration: 2500 });
    }
  };

  // ── Shared styles ───────────────────────────────────────────────────────────

  const s = {
    header: {
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderBottom: `1px solid ${colors.background.secondary}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as React.CSSProperties,

    content: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    } as React.CSSProperties,

    card: {
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
      cursor: 'pointer',
      border: `1px solid ${colors.background.tertiary}`,
      transition: 'box-shadow 0.2s',
    } as React.CSSProperties,

    primaryBtn: (disabled = false): React.CSSProperties => ({
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: disabled ? '#ccc' : colors.primary.zaloBlue,
      color: colors.text.inverse,
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
    }),

    dangerBtn: (disabled = false): React.CSSProperties => ({
      padding: spacing.sm,
      backgroundColor: disabled ? '#fcc' : colors.functional.alertRed,
      color: colors.text.inverse,
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),

    ghostBtn: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: 'transparent',
      color: colors.text.primary,
      border: `1px solid ${colors.background.tertiary}`,
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.md,
    } as React.CSSProperties,

    badge: (color: string): React.CSSProperties => ({
      display: 'inline-block',
      padding: `2px ${spacing.sm}`,
      backgroundColor: `${color}18`,
      color,
      border: `1px solid ${color}`,
      borderRadius: '4px',
      fontSize: fontSize.small,
      fontWeight: fontWeight.medium,
    }),

    input: {
      width: '100%',
      padding: spacing.sm,
      border: `1px solid ${colors.background.tertiary}`,
      borderRadius: '6px',
      fontSize: fontSize.body,
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    textarea: {
      width: '100%',
      padding: spacing.sm,
      border: `1px solid ${colors.background.tertiary}`,
      borderRadius: '6px',
      fontSize: fontSize.body,
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    label: {
      display: 'block',
      fontSize: fontSize.small,
      fontWeight: fontWeight.semibold,
      marginBottom: spacing.xs,
    } as React.CSSProperties,

    stepBox: {
      padding: spacing.md,
      backgroundColor: colors.background.secondary,
      borderRadius: '6px',
      marginBottom: spacing.sm,
      border: `1px solid ${colors.background.tertiary}`,
    } as React.CSSProperties,
  };

  // ── List view ───────────────────────────────────────────────────────────────

  const renderList = () => (
    <>
      <div style={s.header}>
        <div>
          <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            Thư viện Quy trình
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {isTrader ? 'Quản lý tiêu chuẩn canh tác (FR-T10)' : 'Xem tiêu chuẩn canh tác (FR-F06)'}
          </Text>
        </div>
        {isTrader && (
          <button style={s.primaryBtn()} onClick={openCreate} aria-label="Tạo quy trình mới">
            <Icon name="plus-circle" size="sm" color={colors.text.inverse} />
            Tạo mới
          </button>
        )}
      </div>

      <div style={s.content}>
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : standards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spacing.xl} ${spacing.md}`, color: colors.text.secondary }}>
            <Icon name="book" size="lg" color={colors.text.secondary} />
            <Text style={{ marginTop: spacing.md, display: 'block' }}>
              {isTrader
                ? 'Chưa có quy trình nào. Hãy tạo tiêu chuẩn đầu tiên!'
                : 'Chưa có tiêu chuẩn nào được đăng ký.'}
            </Text>
            {isTrader && (
              <button style={{ ...s.primaryBtn(), margin: `${spacing.md} auto 0`, justifyContent: 'center' }} onClick={openCreate}>
                <Icon name="plus-circle" size="sm" color={colors.text.inverse} />
                Tạo quy trình
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <Icon name="book" size="md" color={colors.primary.agriGreen} />
              <Text.Title size="small" style={{ margin: 0 }}>
                Danh sách ({standards.length})
              </Text.Title>
            </div>

            {standards.map((std) => (
              <div
                key={std.id}
                style={s.card}
                onClick={() => openDetail(std.id)}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                  <Text.Title size="small" style={{ margin: 0, flex: 1 }}>
                    {std.name}
                  </Text.Title>
                  <Icon name="list" size="md" color={colors.primary.zaloBlue} />
                </div>

                <div style={{ marginBottom: spacing.sm }}>
                  <span style={s.badge(colors.primary.agriGreen)}>{std.code}</span>
                  {std.ownerTraderId && (
                    <span style={{ ...s.badge(colors.primary.zaloBlue), marginLeft: spacing.xs }}>
                      Riêng
                    </span>
                  )}
                </div>

                <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
                  {std.description.length > 100 ? std.description.slice(0, 100) + '…' : std.description}
                </Text>

                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  {std.steps.length} bước · Tạo {new Date(std.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );

  // ── Detail view ─────────────────────────────────────────────────────────────

  const renderDetail = () => (
    <>
      <div style={s.header}>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          Chi tiết Quy trình
        </Text.Title>
        {isTrader && detail && (
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              style={s.primaryBtn(isMutating)}
              onClick={() => openEdit(detail)}
              disabled={isMutating}
              aria-label="Chỉnh sửa"
            >
              <Icon name="edit" size="sm" color={colors.text.inverse} />
              Sửa
            </button>
            <button
              style={s.dangerBtn(isMutating)}
              onClick={() => handleDelete(detail.id)}
              disabled={isMutating}
              aria-label="Xóa"
            >
              <Icon name="trash" size="sm" color={colors.text.inverse} />
            </button>
          </div>
        )}
      </div>

      <div style={s.content}>
        <button style={s.ghostBtn} onClick={() => setView('list')}>
          ← Quay lại danh sách
        </button>

        {detailLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : detail ? (
          <>
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.background.primary,
                borderRadius: '8px',
                border: `1px solid ${colors.background.tertiary}`,
                marginBottom: spacing.md,
              }}
            >
              <Text.Title size="normal" style={{ margin: 0, marginBottom: spacing.xs }}>
                {detail.name}
              </Text.Title>
              <div style={{ marginBottom: spacing.sm }}>
                <span style={s.badge(colors.primary.agriGreen)}>{detail.code}</span>
                {detail.ownerTraderId && (
                  <span style={{ ...s.badge(colors.primary.zaloBlue), marginLeft: spacing.xs }}>Của bạn</span>
                )}
              </div>
              <Text size="small" style={{ color: colors.text.secondary }}>
                {detail.description}
              </Text>
            </div>

            <Text.Title size="small" style={{ marginBottom: spacing.md }}>
              Các bước thực hiện ({detail.steps.length})
            </Text.Title>

            {detail.steps
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <div key={step.id} style={{ ...s.card, cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <div
                      style={{
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: `${colors.primary.agriGreen}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: fontSize.small,
                        fontWeight: fontWeight.semibold,
                        color: colors.primary.agriGreen,
                      }}
                    >
                      {step.order}
                    </div>
                    <Text.Title size="xSmall" style={{ margin: 0 }}>
                      {step.title}
                    </Text.Title>
                  </div>

                  <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
                    {step.description}
                  </Text>

                  {step.expectedDurationDays && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                      <Icon name="calendar" size="sm" color={colors.text.secondary} />
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                        {step.expectedDurationDays} ngày
                      </Text>
                    </div>
                  )}

                  {step.acceptanceCriteria && (
                    <div
                      style={{
                        marginTop: spacing.xs,
                        padding: spacing.sm,
                        backgroundColor: `${colors.primary.agriGreen}10`,
                        borderRadius: '4px',
                        borderLeft: `3px solid ${colors.primary.agriGreen}`,
                      }}
                    >
                      <Text size="xSmall" style={{ margin: 0 }}>
                        ✓ {step.acceptanceCriteria}
                      </Text>
                    </div>
                  )}
                </div>
              ))}
          </>
        ) : null}
      </div>
    </>
  );

  // ── Form view ───────────────────────────────────────────────────────────────

  const renderForm = () => (
    <>
      <div style={s.header}>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          {editingId ? 'Chỉnh sửa quy trình' : 'Tạo quy trình mới'}
        </Text.Title>
        <button
          style={s.primaryBtn(isMutating)}
          onClick={handleSave}
          disabled={isMutating}
        >
          {isMutating ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>

      <div style={s.content}>
        <button
          style={s.ghostBtn}
          onClick={() => setView(editingId ? 'detail' : 'list')}
          disabled={isMutating}
        >
          ← Hủy
        </button>

        {formError && (
          <div
            style={{
              padding: spacing.sm,
              backgroundColor: `${colors.functional.alertRed}10`,
              border: `1px solid ${colors.functional.alertRed}`,
              borderRadius: '6px',
              marginBottom: spacing.md,
            }}
          >
            <Text size="small" style={{ color: colors.functional.alertRed, margin: 0 }}>
              {formError}
            </Text>
          </div>
        )}

        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.background.primary,
            borderRadius: '8px',
            border: `1px solid ${colors.background.tertiary}`,
            marginBottom: spacing.md,
          }}
        >
          <div style={{ marginBottom: spacing.md }}>
            <label style={s.label}>Mã quy trình *</label>
            <input
              style={s.input}
              placeholder="VD: VIETGAP_2024"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              disabled={isMutating}
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label style={s.label}>Tên quy trình *</label>
            <input
              style={s.input}
              placeholder="VD: VietGAP 2024 — Thanh Long Ruột Đỏ"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={isMutating}
            />
          </div>

          <div>
            <label style={s.label}>Mô tả</label>
            <textarea
              style={s.textarea}
              rows={3}
              placeholder="Mô tả chi tiết về quy trình canh tác..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              disabled={isMutating}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text.Title size="small" style={{ margin: 0 }}>
            Các bước ({formSteps.length})
          </Text.Title>
          <button style={s.primaryBtn(isMutating)} onClick={addStep} disabled={isMutating}>
            <Icon name="plus-circle" size="sm" color={colors.text.inverse} />
            Thêm bước
          </button>
        </div>

        {formSteps.length === 0 && (
          <div
            style={{
              padding: spacing.md,
              textAlign: 'center',
              color: colors.text.secondary,
              border: `1px dashed ${colors.background.tertiary}`,
              borderRadius: '8px',
              marginBottom: spacing.md,
            }}
          >
            <Text size="small">Chưa có bước nào. Nhấn «Thêm bước» để bắt đầu.</Text>
          </div>
        )}

        {formSteps.map((step, idx) => (
          <div key={step.id} style={s.stepBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                Bước {step.order}
              </Text>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing.xs }}
                onClick={() => removeStep(idx)}
                aria-label="Xóa bước"
              >
                <Icon name="trash" size="sm" color={colors.functional.alertRed} />
              </button>
            </div>

            <div style={{ marginBottom: spacing.sm }}>
              <label style={s.label}>Tên bước *</label>
              <input
                style={s.input}
                placeholder="VD: Cắt cành và vệ sinh vườn"
                value={step.title}
                onChange={(e) => updateStep(idx, 'title', e.target.value)}
                disabled={isMutating}
              />
            </div>

            <div style={{ marginBottom: spacing.sm }}>
              <label style={s.label}>Mô tả</label>
              <textarea
                style={s.textarea}
                rows={2}
                placeholder="Hướng dẫn thực hiện bước này..."
                value={step.description}
                onChange={(e) => updateStep(idx, 'description', e.target.value)}
                disabled={isMutating}
              />
            </div>

            <div style={{ marginBottom: spacing.sm }}>
              <label style={s.label}>Thời gian thực hiện (ngày)</label>
              <input
                style={s.input}
                type="number"
                min="1"
                placeholder="VD: 7"
                value={step.expectedDurationDays}
                onChange={(e) => updateStep(idx, 'expectedDurationDays', e.target.value)}
                disabled={isMutating}
              />
            </div>

            <div>
              <label style={s.label}>Tiêu chí nghiệm thu</label>
              <textarea
                style={s.textarea}
                rows={2}
                placeholder="Điều kiện để bước này được coi là hoàn thành..."
                value={step.acceptanceCriteria}
                onChange={(e) => updateStep(idx, 'acceptanceCriteria', e.target.value)}
                disabled={isMutating}
              />
            </div>
          </div>
        ))}

        {formSteps.length > 0 && (
          <button
            style={{ ...s.primaryBtn(isMutating), width: '100%', justifyContent: 'center' }}
            onClick={addStep}
            disabled={isMutating}
          >
            <Icon name="plus-circle" size="sm" color={colors.text.inverse} />
            Thêm bước
          </button>
        )}
      </div>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <RoleAppShell role="trader" className="trader-standard-library-screen">
      {view === 'list' && renderList()}
      {view === 'detail' && renderDetail()}
      {view === 'form' && renderForm()}
    </RoleAppShell>
  );
};

export default TraderStandardLibraryScreen;
