/**
 * Farmer Farm Profile Screen — Phase 3.2 Integration (FR-F01)
 *
 * Màn hình quản lý Hồ sơ Vườn của nông dân.
 * Gọi thực tế: GET|POST|PUT|DELETE /api/v1/farms* qua useFarms hook.
 *
 * - Skeleton loading khi tải danh sách
 * - Empty state khi nông dân chưa có vườn nào
 * - CRUD đầy đủ: tạo / xem chi tiết / chỉnh sửa / xóa
 * - Lỗi hiển thị qua Snackbar ZMP-UI tiếng Việt
 * - 403 (không phải chủ sở hữu) và 409 (có hợp đồng đang hoạt động) được xử lý rõ ràng
 *
 * ZMP SDK: Token đã trao đổi ở Phase 1; interceptor tự gắn Authorization: Bearer.
 * ownerId lấy từ authSessionAtom (Jotai) — không hardcode.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Text, Spinner } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { Icon } from '../../../design-system/components/Icon';
import { Button } from '../../../design-system/components/Button';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useFarms } from '@/hooks/useFarms';
import type { FarmDto, CreateFarmDto } from '@/hooks/useFarms';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CROP_TYPE_LABELS: Record<string, string> = {
  dragon_fruit: 'Thanh long',
  pomelo: 'Bưởi',
  mango: 'Xoài',
  orange: 'Cam',
  longan: 'Nhãn',
  durian: 'Sầu riêng',
  lychee: 'Vải',
  banana: 'Chuối',
  rambutan: 'Chôm chôm',
};

const CROP_TYPE_OPTIONS = Object.entries(CROP_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function cropLabel(cropType: string): string {
  return CROP_TYPE_LABELS[cropType] ?? cropType;
}

function areaDisplay(areaM2: number): string {
  if (areaM2 >= 10000) return `${(areaM2 / 10000).toFixed(2)} ha`;
  return `${areaM2.toLocaleString('vi-VN')} m²`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string; borderRadius?: string }> = ({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius, backgroundColor: colors.background.secondary }}
  />
);

const FarmCardSkeleton: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
    }}
  >
    <SkeletonBlock width="60%" height="18px" />
    <div style={{ marginTop: spacing.sm }}>
      <SkeletonBlock width="40%" height="14px" />
    </div>
    <div style={{ marginTop: spacing.sm, display: 'flex', gap: spacing.sm }}>
      <SkeletonBlock width="80px" height="12px" />
      <SkeletonBlock width="80px" height="12px" />
    </div>
    <div style={{ marginTop: spacing.md }}>
      <SkeletonBlock width="100%" height="32px" borderRadius="8px" />
    </div>
  </div>
);

// ── IoT devices (static — Phase 6 sẽ nối API monitoring) ─────────────────────

interface IoTDevice {
  id: string;
  name: string;
  status: 'online' | 'offline';
  batteryLevel: number;
  sensors: string[];
  lastUpdate: string;
}

const MOCK_DEVICES: IoTDevice[] = [
  {
    id: 'node-001',
    name: 'Node Cảm biến 1',
    status: 'online',
    batteryLevel: 85,
    sensors: ['temperature', 'humidity', 'light'],
    lastUpdate: '5 phút trước',
  },
  {
    id: 'node-002',
    name: 'Node Cảm biến 2',
    status: 'online',
    batteryLevel: 92,
    sensors: ['temperature', 'humidity', 'ph'],
    lastUpdate: '3 phút trước',
  },
  {
    id: 'node-003',
    name: 'Node Cảm biến 3',
    status: 'offline',
    batteryLevel: 15,
    sensors: ['temperature', 'humidity'],
    lastUpdate: '2 giờ trước',
  },
];

const SENSOR_LABELS: Record<string, string> = {
  temperature: '🌡️ Nhiệt độ',
  humidity: '💧 Độ ẩm',
  light: '☀️ Ánh sáng',
  ph: '⚗️ pH',
  soil_moisture: '🌱 Ẩm đất',
};

// ── Form helpers ──────────────────────────────────────────────────────────────

function emptyForm(): CreateFarmDto {
  return {
    name: '',
    location: { province: '', district: '', addressLine: '' },
    area: 10000,
    cropType: 'dragon_fruit',
  };
}

function farmToForm(farm: FarmDto): CreateFarmDto {
  return {
    name: farm.name,
    location: { ...farm.location },
    area: farm.area,
    cropType: farm.cropType,
    standardId: farm.standardId,
  };
}

// ── View modes ────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

// ── Component ─────────────────────────────────────────────────────────────────

export const FarmerFarmProfileScreen: React.FC = () => {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const session = useAtomValue(authSessionAtom);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const {
    farms,
    isLoading,
    isMutating,
    error,
    clearError,
    loadFarms,
    createFarm,
    updateFarm,
    deleteFarm,
  } = useFarms();

  // ── Snackbar ─────────────────────────────────────────────────────────────────
  const openSnackbar = useStableOpenSnackbar();

  // Hiển thị lỗi qua Snackbar khi error thay đổi
  useEffect(() => {
    if (error) {
      openSnackbar({ type: 'error', text: error, duration: 4500, icon: true });
      clearError();
    }
  }, [error, openSnackbar, clearError]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedFarm, setSelectedFarm] = useState<FarmDto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [formData, setFormData] = useState<CreateFarmDto>(emptyForm());
  const [formError, setFormError] = useState('');
  const warnedNoSessionRef = useRef(false);
  const inFlightLoadRef = useRef(false);
  const loadedSessionKeyRef = useRef<string | null>(null);

  // ── Load on mount ─────────────────────────────────────────────────────────────
  const fetchMyFarms = useCallback(async () => {
    if (!session?.userId || !session?.accessToken) return;

    const sessionKey = `${session.userId}:${session.accessToken}`;
    if (loadedSessionKeyRef.current === sessionKey) return;
    if (inFlightLoadRef.current) return;

    inFlightLoadRef.current = true;
    try {
      await loadFarms({ ownerId: session.userId });
      loadedSessionKeyRef.current = sessionKey;
    } finally {
      inFlightLoadRef.current = false;
    }
  }, [loadFarms, session?.userId, session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) {
      loadedSessionKeyRef.current = null;
      if (!warnedNoSessionRef.current) {
        openSnackbar({
          type: 'error',
          text: 'Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.',
          duration: 3500,
          icon: true,
        });
        warnedNoSessionRef.current = true;
      }
      return;
    }
    warnedNoSessionRef.current = false;
    void fetchMyFarms();
  }, [fetchMyFarms, openSnackbar, session?.accessToken]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const openDetail = (farm: FarmDto) => {
    setSelectedFarm(farm);
    setShowQR(false);
    setViewMode('detail');
  };

  const openCreate = () => {
    setFormData(emptyForm());
    setFormError('');
    setViewMode('create');
  };

  const openEdit = (farm: FarmDto) => {
    setSelectedFarm(farm);
    setFormData(farmToForm(farm));
    setFormError('');
    setViewMode('edit');
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedFarm(null);
  };

  // ── CRUD actions ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formData.name.trim()) { setFormError('Vui lòng nhập tên vườn'); return; }
    if (!formData.location.province.trim()) { setFormError('Vui lòng nhập tỉnh/thành'); return; }
    setFormError('');
    const created = await createFarm(formData);
    if (created) {
      openSnackbar({ type: 'success', text: 'Tạo vườn thành công!', duration: 3000, icon: true });
      setSelectedFarm(created);
      setViewMode('detail');
    }
  };

  const handleUpdate = async () => {
    if (!selectedFarm) return;
    if (!formData.name.trim()) { setFormError('Vui lòng nhập tên vườn'); return; }
    setFormError('');
    const updated = await updateFarm(selectedFarm.id, formData);
    if (updated) {
      openSnackbar({ type: 'success', text: 'Cập nhật vườn thành công!', duration: 3000, icon: true });
      setSelectedFarm(updated);
      setViewMode('detail');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteFarm(id);
    if (ok) {
      openSnackbar({ type: 'success', text: 'Đã xóa vườn.', duration: 3000, icon: true });
      setDeleteConfirmId(null);
      if (viewMode === 'detail') backToList();
    } else {
      setDeleteConfirmId(null);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────────

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: 80,
  };

  const farmCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: spacing.md,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `2px ${spacing.sm}`,
    backgroundColor: `${color}18`,
    borderRadius: '99px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color,
  });

  const infoRowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  };

  const sectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderTop: `8px solid ${colors.background.secondary}`,
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '8px',
    fontSize: fontSize.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  };

  const fieldGroupStyles: React.CSSProperties = {
    marginBottom: spacing.md,
  };

  // ── Empty state ───────────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${spacing.xl} ${spacing.md}`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: `${colors.primary.agriGreen}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Icon name="farm" size="lg" color={colors.primary.agriGreen} />
      </div>
      <Text.Title size="small" style={{ color: colors.text.primary, marginBottom: spacing.sm }}>
        Chưa có vườn nào
      </Text.Title>
      <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.lg }}>
        Hãy tạo Farm Lab đầu tiên để bắt đầu quản lý vườn và chăm sóc cây trồng.
      </Text>
      <Button variant="primary" size="medium" onClick={openCreate} icon="add">
        Tạo vườn mới
      </Button>
    </div>
  );

  // ── List view ─────────────────────────────────────────────────────────────────

  const renderList = () => (
    <>
      {isLoading && (
        <div style={contentStyles}>
          {[1, 2, 3].map((k) => <FarmCardSkeleton key={k} />)}
        </div>
      )}

      {!isLoading && farms.length === 0 && (
        <div style={contentStyles}>{renderEmptyState()}</div>
      )}

      {!isLoading && farms.length > 0 && (
        <div style={contentStyles}>
          <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
            {farms.length} vườn
          </Text>

          {farms.map((farm) => (
            <div
              key={farm.id}
              style={farmCardStyles}
              onClick={() => openDetail(farm)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                    {farm.name}
                  </Text.Title>
                </div>
                <span style={badgeStyles(colors.primary.agriGreen)}>
                  {cropLabel(farm.cropType)}
                </span>
              </div>

              <div style={{ marginTop: spacing.sm, display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <Icon name="map-pin" size="sm" color={colors.text.secondary} />
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    {farm.location.province}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <Icon name="crop" size="sm" color={colors.text.secondary} />
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    {areaDisplay(farm.area)}
                  </Text>
                </div>
                {farm.standardId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                    <Text size="xSmall" style={{ color: colors.primary.agriGreen }}>
                      Có tiêu chuẩn
                    </Text>
                  </div>
                )}
              </div>

              <div
                style={{ marginTop: spacing.md, display: 'flex', gap: spacing.sm }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  style={{
                    flex: 1,
                    padding: `${spacing.sm} 0`,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: fontSize.caption,
                    fontWeight: fontWeight.medium,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                  }}
                  onClick={() => openEdit(farm)}
                >
                  <Icon name="edit" size="sm" color={colors.primary.zaloBlue} />
                  Chỉnh sửa
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: `${spacing.sm} 0`,
                    backgroundColor: `${colors.functional.alertRed}12`,
                    color: colors.functional.alertRed,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: fontSize.caption,
                    fontWeight: fontWeight.medium,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                  }}
                  onClick={() => setDeleteConfirmId(farm.id)}
                >
                  <Icon name="trash" size="sm" color={colors.functional.alertRed} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      {!isLoading && (
        <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 200 }}>
          <button
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: colors.primary.agriGreen,
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 16px rgba(62,187,108,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 28,
            }}
            onClick={openCreate}
            aria-label="Thêm vườn mới"
          >
            +
          </button>
        </div>
      )}
    </>
  );

  // ── Detail view ───────────────────────────────────────────────────────────────

  const renderDetail = () => {
    if (!selectedFarm) return null;

    return (
      <>
        <div
          style={{
            height: 180,
            background: `linear-gradient(135deg, ${colors.primary.agriGreen} 0%, #27a25a 100%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: spacing.md,
          }}
        >
          <span style={badgeStyles('#fff')}>{cropLabel(selectedFarm.cropType)}</span>
          <Text.Title
            size="large"
            style={{ margin: 0, color: '#fff', fontWeight: fontWeight.bold, marginTop: spacing.xs }}
          >
            {selectedFarm.name}
          </Text.Title>
          <Text size="small" style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            {selectedFarm.location.province}
          </Text>
        </div>

        <div style={{ padding: spacing.md, backgroundColor: colors.background.primary }}>
          <Text.Title size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.md }}>
            Thông tin vườn
          </Text.Title>

          <div style={infoRowStyles}>
            <Icon name="crop" size="md" color={colors.primary.agriGreen} />
            <div>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Diện tích</Text>
              <Text size="small" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
                {areaDisplay(selectedFarm.area)}
              </Text>
            </div>
          </div>

          <div style={infoRowStyles}>
            <Icon name="map-pin" size="md" color={colors.primary.zaloBlue} />
            <div>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Địa chỉ</Text>
              <Text size="small" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
                {selectedFarm.location.addressLine}, {selectedFarm.location.district},{' '}
                {selectedFarm.location.province}
              </Text>
            </div>
          </div>

          {selectedFarm.location.lat != null && (
            <div
              style={{
                width: '100%',
                height: 120,
                backgroundColor: colors.background.secondary,
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: spacing.sm,
                border: `1px solid ${colors.background.tertiary}`,
              }}
            >
              <Icon name="map-pin" size="lg" color={colors.primary.zaloBlue} />
              <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                {selectedFarm.location.lat?.toFixed(4)}, {selectedFarm.location.lng?.toFixed(4)}
              </Text>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>(Bản đồ tích hợp)</Text>
            </div>
          )}

          <div style={{ ...infoRowStyles, marginTop: spacing.sm }}>
            <Icon name="plant" size="md" color={colors.primary.agriGreen} />
            <div>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Tạo lúc</Text>
              <Text size="small" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
                {formatDate(selectedFarm.createdAt)}
              </Text>
            </div>
          </div>

          {selectedFarm.standardId && (
            <div
              style={{
                marginTop: spacing.sm,
                padding: spacing.sm,
                backgroundColor: `${colors.primary.agriGreen}12`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Icon name="check" size="md" color={colors.primary.agriGreen} />
              <div>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  Tiêu chuẩn áp dụng
                </Text>
                <Text
                  size="small"
                  style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.semibold, margin: 0 }}
                >
                  {selectedFarm.standardId}
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* QR section */}
        <div style={sectionStyles}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
              Mã QR Truy xuất
            </Text.Title>
            <button
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: 'transparent',
                color: colors.primary.zaloBlue,
                border: `1px solid ${colors.primary.zaloBlue}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: fontSize.caption,
              }}
              onClick={() => setShowQR(!showQR)}
            >
              {showQR ? 'Ẩn' : 'Hiển thị'}
            </button>
          </div>
          {showQR && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: spacing.lg,
                border: `2px solid ${colors.primary.agriGreen}`,
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  width: 180,
                  height: 180,
                  backgroundColor: colors.background.secondary,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                }}
              >
                <Icon name="qr-code" size="lg" color={colors.text.secondary} />
              </div>
              <Text size="small" style={{ textAlign: 'center', color: colors.text.secondary, margin: 0 }}>
                Khách hàng quét để xem truy xuất nguồn gốc vườn {selectedFarm.name}
              </Text>
            </div>
          )}
        </div>

        {/* IoT section */}
        <div style={sectionStyles}>
          <Text.Title size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.md }}>
            Thiết bị IoT ({MOCK_DEVICES.length})
          </Text.Title>

          {MOCK_DEVICES.map((device) => (
            <div
              key={device.id}
              style={{
                padding: spacing.md,
                borderRadius: '10px',
                border: `2px solid ${
                  device.status === 'online' ? colors.primary.agriGreen : colors.background.tertiary
                }`,
                marginBottom: spacing.md,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Icon
                    name="farm"
                    size="md"
                    color={device.status === 'online' ? colors.primary.agriGreen : colors.text.secondary}
                  />
                  <div>
                    <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                      {device.name}
                    </Text>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      ID: {device.id}
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: `2px ${spacing.sm}`,
                    backgroundColor:
                      device.status === 'online'
                        ? `${colors.primary.agriGreen}18`
                        : colors.background.secondary,
                    borderRadius: '99px',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor:
                        device.status === 'online' ? colors.primary.agriGreen : colors.text.secondary,
                    }}
                  />
                  <Text size="xSmall" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                    {device.status === 'online' ? 'Online' : 'Offline'}
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                {device.sensors.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: `2px ${spacing.sm}`,
                      backgroundColor: colors.background.secondary,
                      borderRadius: '4px',
                      fontSize: fontSize.small,
                      color: colors.text.secondary,
                    }}
                  >
                    {SENSOR_LABELS[s] ?? s}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.sm }}>
                <Text
                  size="xSmall"
                  style={{
                    color:
                      device.batteryLevel < 20
                        ? colors.functional.alertRed
                        : colors.primary.agriGreen,
                  }}
                >
                  🔋 {device.batteryLevel}%
                </Text>
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  Cập nhật {device.lastUpdate}
                </Text>
              </div>
            </div>
          ))}

          <div style={{ width: '100%', marginTop: spacing.sm }}>
            <Button variant="outline" size="medium" icon="add">
              Thêm thiết bị mới
            </Button>
          </div>
        </div>

        {/* Detail actions */}
        <div
          style={{
            padding: spacing.md,
            display: 'flex',
            gap: spacing.md,
            backgroundColor: colors.background.primary,
            borderTop: `1px solid ${colors.background.secondary}`,
          }}
        >
          <button
            style={{
              flex: 1,
              padding: spacing.md,
              backgroundColor: colors.primary.zaloBlue,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: fontWeight.semibold,
              fontSize: fontSize.body,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}
            onClick={() => openEdit(selectedFarm)}
          >
            <Icon name="edit" size="sm" color="#fff" />
            Chỉnh sửa
          </button>
          <button
            style={{
              flex: 1,
              padding: spacing.md,
              backgroundColor: `${colors.functional.alertRed}14`,
              color: colors.functional.alertRed,
              border: `1px solid ${colors.functional.alertRed}`,
              borderRadius: '10px',
              fontWeight: fontWeight.semibold,
              fontSize: fontSize.body,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}
            onClick={() => setDeleteConfirmId(selectedFarm.id)}
          >
            <Icon name="trash" size="sm" color={colors.functional.alertRed} />
            Xóa vườn
          </button>
        </div>
      </>
    );
  };

  // ── Form ──────────────────────────────────────────────────────────────────────

  const renderForm = (mode: 'create' | 'edit') => {
    const isEdit = mode === 'edit';
    return (
      <div style={contentStyles}>
        <div style={{ marginBottom: spacing.lg }}>
          <Text.Title size="small" style={{ fontWeight: fontWeight.bold }}>
            {isEdit ? 'Chỉnh sửa vườn' : 'Tạo vườn mới'}
          </Text.Title>
          <Text size="small" style={{ color: colors.text.secondary }}>
            {isEdit
              ? 'Cập nhật thông tin định danh cho vườn của bạn.'
              : 'Điền thông tin để đăng ký Farm Lab mới.'}
          </Text>
        </div>

        <div style={fieldGroupStyles}>
          <label style={labelStyles}>Tên vườn *</label>
          <input
            style={inputStyles}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Farm Lab Đông A"
          />
        </div>

        <div style={fieldGroupStyles}>
          <label style={labelStyles}>Loại cây trồng *</label>
          <select
            style={{ ...inputStyles, cursor: 'pointer' }}
            value={formData.cropType}
            onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
          >
            {CROP_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldGroupStyles}>
          <label style={labelStyles}>Diện tích (m²) *</label>
          <input
            style={inputStyles}
            type="number"
            min={100}
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
            placeholder="VD: 25000"
          />
          {formData.area > 0 && (
            <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
              ≈ {areaDisplay(formData.area)}
            </Text>
          )}
        </div>

        <div style={fieldGroupStyles}>
          <label style={labelStyles}>Tỉnh / Thành phố *</label>
          <input
            style={inputStyles}
            value={formData.location.province}
            onChange={(e) =>
              setFormData({ ...formData, location: { ...formData.location, province: e.target.value } })
            }
            placeholder="VD: Tiền Giang"
          />
        </div>

        <div style={fieldGroupStyles}>
          <label style={labelStyles}>Huyện / Quận</label>
          <input
            style={inputStyles}
            value={formData.location.district}
            onChange={(e) =>
              setFormData({ ...formData, location: { ...formData.location, district: e.target.value } })
            }
            placeholder="VD: Châu Thành"
          />
        </div>

        <div style={fieldGroupStyles}>
          <label style={labelStyles}>Địa chỉ chi tiết</label>
          <input
            style={inputStyles}
            value={formData.location.addressLine}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: { ...formData.location, addressLine: e.target.value },
              })
            }
            placeholder="VD: Xã Tân Thành, Huyện Châu Thành"
          />
        </div>

        {formError && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: `${colors.functional.alertRed}12`,
              border: `1px solid ${colors.functional.alertRed}`,
              borderRadius: '8px',
              marginBottom: spacing.md,
            }}
          >
            <Text size="small" style={{ color: colors.functional.alertRed, margin: 0 }}>
              {formError}
            </Text>
          </div>
        )}

        <div style={{ display: 'flex', gap: spacing.md }}>
          <button
            style={{
              flex: 1,
              padding: spacing.md,
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              border: 'none',
              borderRadius: '10px',
              fontWeight: fontWeight.semibold,
              cursor: 'pointer',
              fontSize: fontSize.body,
            }}
            onClick={backToList}
            disabled={isMutating}
          >
            Hủy
          </button>
          <button
            style={{
              flex: 2,
              padding: spacing.md,
              backgroundColor: isMutating ? colors.background.tertiary : colors.primary.agriGreen,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: fontWeight.semibold,
              cursor: isMutating ? 'not-allowed' : 'pointer',
              fontSize: fontSize.body,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}
            onClick={isEdit ? handleUpdate : handleCreate}
            disabled={isMutating}
          >
            {isMutating ? (
              <>
                <Spinner />
                Đang lưu…
              </>
            ) : isEdit ? (
              'Cập nhật vườn'
            ) : (
              'Tạo vườn'
            )}
          </button>
        </div>
      </div>
    );
  };

  // ── Delete confirm sheet ───────────────────────────────────────────────────────

  const renderDeleteDialog = () => {
    if (!deleteConfirmId) return null;
    const target = farms.find((f) => f.id === deleteConfirmId) ?? selectedFarm;
    if (!target) return null;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 500,
        }}
        onClick={() => setDeleteConfirmId(null)}
      >
        <div
          style={{
            width: '100%',
            backgroundColor: colors.background.primary,
            borderRadius: '16px 16px 0 0',
            padding: spacing.lg,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: `${colors.functional.alertRed}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing.md,
              }}
            >
              <Icon name="trash" size="lg" color={colors.functional.alertRed} />
            </div>
            <Text.Title size="small" style={{ fontWeight: fontWeight.bold, marginBottom: spacing.sm }}>
              Xóa vườn này?
            </Text.Title>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Vườn <strong>{target.name}</strong> sẽ bị xóa vĩnh viễn. Nếu vườn đang có hợp đồng hoạt động,
              thao tác sẽ bị từ chối.
            </Text>
          </div>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <button
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
                border: 'none',
                borderRadius: '10px',
                fontWeight: fontWeight.semibold,
                cursor: 'pointer',
              }}
              onClick={() => setDeleteConfirmId(null)}
              disabled={isMutating}
            >
              Hủy
            </button>
            <button
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor: colors.functional.alertRed,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: fontWeight.semibold,
                cursor: isMutating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
              onClick={() => handleDelete(deleteConfirmId)}
              disabled={isMutating}
            >
              {isMutating ? <Spinner /> : 'Xóa'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Header ────────────────────────────────────────────────────────────────────

  const pageTitle =
    viewMode === 'list'
      ? 'Vườn của tôi'
      : viewMode === 'detail'
      ? (selectedFarm?.name ?? 'Chi tiết vườn')
      : viewMode === 'create'
      ? 'Tạo vườn mới'
      : 'Chỉnh sửa vườn';

  const showBackButton = viewMode !== 'list';

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.4s ease-in-out infinite;
        }
      `}</style>

      <Page className="farmer-farm-profile-screen">
        <div style={headerStyles}>
          {showBackButton && (
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: spacing.xs,
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={viewMode === 'edit' ? () => setViewMode('detail') : backToList}
              aria-label="Quay lại"
            >
              <Icon name="chevron-left" size="md" color={colors.primary.zaloBlue} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
              {pageTitle}
            </Text.Title>
          </div>
          {viewMode === 'list' && !isLoading && (
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: spacing.xs,
                fontSize: '18px',
                color: colors.primary.zaloBlue,
              }}
              onClick={fetchMyFarms}
              aria-label="Làm mới"
            >
              ↻
            </button>
          )}
        </div>

        {viewMode === 'list' && renderList()}
        {viewMode === 'detail' && renderDetail()}
        {viewMode === 'create' && renderForm('create')}
        {viewMode === 'edit' && renderForm('edit')}

        {renderDeleteDialog()}
      </Page>
    </>
  );
};

export default FarmerFarmProfileScreen;
