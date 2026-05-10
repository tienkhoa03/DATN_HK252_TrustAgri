/**
 * FarmLabSection — CRUD farms with inline edit, QR code, MapPicker (FR-F01, FR-G01)
 */

import React, { useState, useEffect } from 'react';
import { Text, useNavigate } from 'zmp-ui';
import { QRCode } from '@/design-system/components/QRCode';
import { MapPicker } from '@/design-system/components/MapPicker';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useFarms } from '@/hooks/useFarms';
import type { FarmDto, CreateFarmDto, UpdateFarmDto } from '@/hooks/useFarms';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';

const CROP_OPTIONS = [
  { value: 'dragon_fruit', label: 'Thanh long' },
  { value: 'rice', label: 'Lúa' },
  { value: 'vegetable', label: 'Rau củ' },
  { value: 'fruit', label: 'Trái cây' },
  { value: 'herb', label: 'Dược liệu' },
  { value: 'other', label: 'Khác' },
];

interface FarmCardProps {
  farm: FarmDto;
  onUpdate: (id: string, body: UpdateFarmDto) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const FarmCard: React.FC<FarmCardProps> = ({ farm, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateFarmDto>({
    name: farm.name,
    cropType: farm.cropType,
    area: farm.area,
    standardId: farm.standardId ?? '',
    location: { ...farm.location },
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(farm.id, form);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    await onDelete(farm.id);
    setSaving(false);
  };

  const traceUrl = farm.traceabilityCode
    ? `${window.location.origin}/guest/trace/${farm.traceabilityCode}`
    : '';

  return (
    <div style={{
      border: `1px solid ${colors.background.secondary}`,
      borderRadius: 10, backgroundColor: colors.background.primary,
      marginBottom: spacing.sm, overflow: 'hidden',
    }}>
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: spacing.md, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          minHeight: 44,
        }}
      >
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>{farm.name}</Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {CROP_OPTIONS.find((c) => c.value === farm.cropType)?.label ?? farm.cropType} · {farm.area.toLocaleString()} m²
          </Text>
        </div>
        <span style={{ fontSize: '18px', color: colors.text.secondary, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${colors.background.secondary}`, padding: spacing.md }}>
          {/* QR code */}
          {traceUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing.md }}>
              <QRCode value={traceUrl} size={120} />
            </div>
          )}

          {!editing && (
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ fontSize: fontSize.caption, color: colors.text.secondary, marginBottom: spacing.xs }}>Tiêu chuẩn: {farm.standardId ?? '—'}</div>
              <div style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>
                Vị trí: {farm.location.province}, {farm.location.district}
              </div>
            </div>
          )}

          {editing && (
            <div>
              <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Tên vườn</label>
              <input
                value={form.name ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, boxSizing: 'border-box' }}
              />

              <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Loại cây</label>
              <select
                value={form.cropType ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, cropType: e.target.value }))}
                style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, minHeight: 44 }}
              >
                {CROP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Diện tích (m²)</label>
              <input
                type="number"
                value={form.area ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, area: Number(e.target.value) }))}
                style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, boxSizing: 'border-box' }}
              />

              <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>ID Tiêu chuẩn</label>
              <input
                value={form.standardId ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, standardId: e.target.value || undefined }))}
                placeholder="Để trống nếu chưa có"
                style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, boxSizing: 'border-box' }}
              />

              <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Vị trí GPS</label>
              <MapPicker
                lat={form.location?.lat}
                lng={form.location?.lng}
                onChange={(lat, lng) => setForm((p) => ({ ...p, location: { ...(p.location ?? farm.location), lat, lng } }))}
                height={200}
              />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
            {!editing ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{ flex: 1, padding: spacing.sm, backgroundColor: colors.primary.zaloBlue, color: colors.text.inverse, border: 'none', borderRadius: 8, fontSize: fontSize.caption, fontWeight: fontWeight.medium, cursor: 'pointer', minHeight: 44 }}
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  style={{
                    flex: 1, padding: spacing.sm,
                    backgroundColor: colors.background.primary,
                    color: confirmDelete ? colors.functional.alertRed : colors.text.secondary,
                    border: `1px solid ${confirmDelete ? colors.functional.alertRed : colors.background.secondary}`,
                    borderRadius: 8, fontSize: fontSize.caption, fontWeight: fontWeight.medium,
                    cursor: saving ? 'not-allowed' : 'pointer', minHeight: 44,
                  }}
                >
                  {saving ? 'Đang xóa…' : confirmDelete ? 'Xác nhận xóa' : 'Xóa vườn'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm({ name: farm.name, cropType: farm.cropType, area: farm.area, standardId: farm.standardId, location: { ...farm.location } }); }}
                  style={{ flex: 1, padding: spacing.sm, backgroundColor: colors.background.secondary, color: colors.text.primary, border: 'none', borderRadius: 8, fontSize: fontSize.caption, fontWeight: fontWeight.medium, cursor: 'pointer', minHeight: 44 }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, padding: spacing.sm, backgroundColor: saving ? colors.text.disabled : colors.primary.agriGreen, color: colors.text.inverse, border: 'none', borderRadius: 8, fontSize: fontSize.caption, fontWeight: fontWeight.semibold, cursor: saving ? 'not-allowed' : 'pointer', minHeight: 44 }}
                >
                  {saving ? 'Đang lưu…' : 'Lưu'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CreateFarmFormProps {
  onCancel: () => void;
  onSubmit: (body: CreateFarmDto) => Promise<void>;
}

const CreateFarmForm: React.FC<CreateFarmFormProps> = ({ onCancel, onSubmit }) => {
  const [form, setForm] = useState<CreateFarmDto>({
    name: '',
    cropType: 'vegetable',
    area: 0,
    standardId: undefined,
    location: { province: '', district: '', addressLine: '', lat: undefined, lng: undefined },
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || form.area <= 0) return;
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  return (
    <div style={{ padding: spacing.md, backgroundColor: `${colors.primary.agriGreen}08`, border: `1px solid ${colors.primary.agriGreen}`, borderRadius: 10, marginBottom: spacing.sm }}>
      <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>Thêm vườn mới</Text.Title>

      <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Tên vườn *</label>
      <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, boxSizing: 'border-box' }} />

      <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Loại cây</label>
      <select value={form.cropType} onChange={(e) => setForm((p) => ({ ...p, cropType: e.target.value }))} style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, minHeight: 44 }}>
        {CROP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Diện tích (m²) *</label>
      <input type="number" value={form.area || ''} onChange={(e) => setForm((p) => ({ ...p, area: Number(e.target.value) }))} style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, boxSizing: 'border-box' }} />

      <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Tỉnh/Thành</label>
      <input value={form.location.province} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, province: e.target.value } }))} style={{ width: '100%', padding: spacing.sm, border: `1px solid ${colors.background.secondary}`, borderRadius: 8, fontSize: fontSize.caption, marginBottom: spacing.sm, boxSizing: 'border-box' }} />

      <label style={{ display: 'block', fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>Vị trí GPS (tùy chọn)</label>
      <MapPicker
        onChange={(lat, lng) => setForm((p) => ({ ...p, location: { ...p.location, lat, lng } }))}
        height={180}
      />

      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: spacing.sm, backgroundColor: colors.background.secondary, color: colors.text.primary, border: 'none', borderRadius: 8, fontSize: fontSize.caption, cursor: 'pointer', minHeight: 44 }}>Hủy</button>
        <button type="button" onClick={handleSubmit} disabled={saving || !form.name.trim() || form.area <= 0} style={{ flex: 1, padding: spacing.sm, backgroundColor: saving ? colors.text.disabled : colors.primary.agriGreen, color: colors.text.inverse, border: 'none', borderRadius: 8, fontSize: fontSize.caption, fontWeight: fontWeight.semibold, cursor: saving ? 'not-allowed' : 'pointer', minHeight: 44 }}>
          {saving ? 'Đang tạo…' : 'Tạo vườn'}
        </button>
      </div>
    </div>
  );
};

export interface FarmLabSectionProps {
  ownerId?: string;
}

export const FarmLabSection: React.FC<FarmLabSectionProps> = ({ ownerId }) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const { farms, isLoading, isMutating, error, clearError, loadFarms, createFarm, updateFarm, deleteFarm } = useFarms();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (ownerId) loadFarms({ ownerId });
  }, [ownerId, loadFarms]);

  useEffect(() => {
    if (error) { openSnackbar({ type: 'error', text: error, duration: 3500, icon: true }); clearError(); }
  }, [error, openSnackbar, clearError]);

  const handleCreate = async (body: CreateFarmDto) => {
    const result = await createFarm(body);
    if (result) {
      openSnackbar({ type: 'success', text: 'Đã tạo vườn thành công!', duration: 2500, icon: true });
      setShowCreate(false);
    }
  };

  const handleUpdate = async (id: string, body: UpdateFarmDto) => {
    const result = await updateFarm(id, body);
    if (result) openSnackbar({ type: 'success', text: 'Đã cập nhật vườn!', duration: 2500, icon: true });
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteFarm(id);
    if (ok) openSnackbar({ type: 'success', text: 'Đã xóa vườn.', duration: 2500, icon: true });
  };

  return (
    <div style={{ padding: `0 ${spacing.md}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text.Title size="small" style={{ margin: 0 }}>Farm Lab</Text.Title>
      </div>

      {isLoading && (
        <div style={{ height: 120, backgroundColor: colors.background.secondary, borderRadius: 8 }} className="skeleton-pulse" />
      )}

      {!isLoading && showCreate && (
        <CreateFarmForm onCancel={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}

      {!isLoading && farms.length === 0 && !showCreate && (
        <EmptyState
          icon="🌱"
          title="Chưa có vườn nào"
          description="Tạo hồ sơ vườn để bắt đầu theo dõi."
          cta={{ label: '+ Thêm vườn', onClick: () => setShowCreate(true) }}
        />
      )}

      {!isLoading && farms.map((farm) => (
        <FarmCard
          key={farm.id}
          farm={farm}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}

      {/* FAB */}
      {!showCreate && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="Thêm vườn mới"
          style={{
            position: 'fixed', bottom: 88, right: 16, zIndex: 900,
            display: 'flex', alignItems: 'center', gap: spacing.xs,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.primary.agriGreen, color: colors.text.inverse,
            border: 'none', borderRadius: 24,
            fontSize: fontSize.caption, fontWeight: fontWeight.semibold,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(62,187,108,0.4)',
            minHeight: 44,
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
          Thêm vườn
        </button>
      )}
    </div>
  );
};

export default FarmLabSection;
