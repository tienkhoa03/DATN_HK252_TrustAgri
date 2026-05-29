/**
 * TraderProfileLayout — sub-screen for trader role inside ProfileScreen.
 *
 * FR-T01: Trader profile management
 * NFR-U01: 3-click rule (edit actions reachable in <= 3 taps)
 * NFR-U03: Touch target >= 44x44px, min font 14px
 */

import React, { useState } from 'react';
import { Box, Text } from 'zmp-ui';
import { useNavigate } from 'zmp-ui';
import { useSetAtom, useAtomValue } from 'jotai';
import { authSessionAtom, availableRolesAtom } from '@/state/authAtoms';
import * as authService from '@/services/authService';
import * as marketplaceService from '@/services/marketplaceService';
import type { UserProfileDto, UserProfileUpdateDto } from '@/services/authService';
import type { ProductDto } from '@/services/marketplaceService';
import { CROP_LABELS } from '@/services/marketplaceService';
import { primaryColors, functionalColors, textColors, backgroundColors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useTrustScore } from '@/hooks/useTrustScore';
import { useTraderReviews } from '@/hooks/useTraderReviews';
import {
  updateTraderReview,
  deleteTraderReview,
  toReviewViMessage,
  type TrustScoreDto,
} from '@/services/traderReviewService';
import { useQueryClient } from '@tanstack/react-query';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalId = 'company' | 'contact' | 'capacity' | 'security' | null;

interface TraderProfileLayoutProps {
  profile: UserProfileDto;
  updateProfile: (patch: UserProfileUpdateDto) => Promise<boolean>;
  isSaving: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────

export function TraderProfileLayout({ profile, updateProfile, isSaving }: TraderProfileLayoutProps) {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();
  const setSession = useSetAtom(authSessionAtom);
  const availableRoles = useAtomValue(availableRolesAtom);

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  // Edit form fields
  const [companyName, setCompanyName]         = useState(profile.traderProfile?.companyName ?? '');
  const [region, setRegion]                   = useState(profile.traderProfile?.region ?? '');
  const [phone, setPhone]                     = useState(profile.phone ?? '');
  const [capacity, setCapacity]               = useState(profile.traderProfile?.capacity ?? '');
  const [purchasedCropTypes, setPurchasedCropTypes] = useState<string[]>(
    profile.traderProfile?.purchasedCropTypes ?? [],
  );

  const closeModal = () => setActiveModal(null);

  // ── Save handlers ─────────────────────────────────────────────────────────

  const saveCompany = async () => {
    const patch: UserProfileUpdateDto = {
      traderProfile: {
        companyName,
        region,
        capacity: profile.traderProfile?.capacity ?? '',
        trustScore: profile.traderProfile?.trustScore ?? 0,
        purchasedCropTypes: profile.traderProfile?.purchasedCropTypes ?? [],
      },
    };
    const ok = await updateProfile(patch);
    if (ok) {
      openSnackbar({ type: 'success', text: 'Cập nhật thông tin doanh nghiệp thành công!', duration: 3000, icon: true });
      closeModal();
    }
  };

  const saveContact = async () => {
    const ok = await updateProfile({ phone });
    if (ok) {
      openSnackbar({ type: 'success', text: 'Cập nhật liên hệ thành công!', duration: 3000, icon: true });
      closeModal();
    }
  };

  const saveCapacity = async () => {
    const patch: UserProfileUpdateDto = {
      traderProfile: {
        companyName:  profile.traderProfile?.companyName ?? '',
        region:       profile.traderProfile?.region ?? '',
        capacity,
        trustScore:   profile.traderProfile?.trustScore ?? 0,
        purchasedCropTypes,
      },
    };
    const ok = await updateProfile(patch);
    if (ok) {
      openSnackbar({ type: 'success', text: 'Cập nhật năng lực thu mua thành công!', duration: 3000, icon: true });
      closeModal();
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore server error; clear local session regardless
    } finally {
      setSession(null);
      openSnackbar({ type: 'success', text: 'Đã đăng xuất.', duration: 2500, icon: true });
      navigate('/', { replace: true });
    }
  };

  // ── Avatar initials ───────────────────────────────────────────────────────

  const initials = (profile.displayName ?? '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const { trustScore } = useTrustScore(profile.userId);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box style={{ paddingBottom: spacing.xxl }}>

      {/* ── Header block ─────────────────────────────────────────────────── */}
      <Box
        style={{
          background: `linear-gradient(160deg, ${primaryColors.zaloBlue}CC 0%, ${primaryColors.zaloBlue} 100%)`,
          padding: `${spacing.xl} ${spacing.md} ${spacing.lg}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {/* Avatar */}
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: fontWeight.bold,
            color: '#fff',
          }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            initials || '🏢'
          )}
        </Box>

        {/* Name */}
        <Text
          style={{
            fontSize: fontSize.h2,
            fontWeight: fontWeight.bold,
            color: '#fff',
            textAlign: 'center',
          }}
        >
          {profile.displayName}
        </Text>

        {/* Company name */}
        {profile.traderProfile?.companyName && (
          <Text style={{ fontSize: fontSize.caption, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
            {profile.traderProfile.companyName}
          </Text>
        )}

        {/* Trust score chip */}
        {trustScore && trustScore.count > 0 && trustScore.average !== null ? (
          <Box
            style={{
              background: 'rgba(255,204,0,0.2)',
              border: '1px solid rgba(255,204,0,0.6)',
              borderRadius: 99,
              padding: `${spacing.xs} ${spacing.sm}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Text style={{ fontSize: fontSize.caption, fontWeight: fontWeight.bold, color: '#FFCC00' }}>
              ★ {trustScore.average.toFixed(1)}/5 ({trustScore.count})
            </Text>
          </Box>
        ) : (
          <Box
            style={{
              background: 'rgba(180,180,180,0.15)',
              border: '1px solid rgba(180,180,180,0.4)',
              borderRadius: 99,
              padding: `${spacing.xs} ${spacing.sm}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Text style={{ fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: 'rgba(255,255,255,0.7)' }}>
              Chưa có đánh giá
            </Text>
          </Box>
        )}

        {/* Public preview button */}
        <button
          type="button"
          onClick={() => setShowPublicPreview(true)}
          style={{
            marginTop: spacing.xs,
            width: '100%',
            maxWidth: 280,
            minHeight: 44,
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: 10,
            background: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.7)',
            color: '#fff',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            cursor: 'pointer',
          }}
        >
          Xem trước giao diện công khai
        </button>
      </Box>

      {/* ── Menu list ────────────────────────────────────────────────────── */}
      <Box
        style={{
          background: backgroundColors.primary,
          margin: `${spacing.md} ${spacing.md} 0`,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        <MenuRow
          icon="🏢"
          label="Thông tin doanh nghiệp"
          onTap={() => {
            setCompanyName(profile.traderProfile?.companyName ?? '');
            setRegion(profile.traderProfile?.region ?? '');
            setActiveModal('company');
          }}
        />
        <MenuRow
          icon="📞"
          label="Liên hệ"
          onTap={() => {
            setPhone(profile.phone ?? '');
            setActiveModal('contact');
          }}
        />
        <MenuRow
          icon="📦"
          label="Năng lực thu mua"
          onTap={() => {
            setCapacity(profile.traderProfile?.capacity ?? '');
            setPurchasedCropTypes(profile.traderProfile?.purchasedCropTypes ?? []);
            setActiveModal('capacity');
          }}
        />
        <MenuRow
          icon="🔒"
          label="Bảo mật"
          onTap={() => setActiveModal('security')}
        />
        <MenuRow
          icon="★"
          label="Đánh giá từ người mua"
          subLabel={`${trustScore?.count ?? 0} đánh giá`}
          onTap={() => setShowReviews(true)}
        />
        {availableRoles.length > 1 && (
          <MenuRow
            icon="🎭"
            label="Chuyển vai trò"
            onTap={() => navigate('/role-select')}
          />
        )}
        <MenuRow
          icon="🚪"
          label="Đăng xuất"
          onTap={handleLogout}
          danger
          noChevron
        />
      </Box>

      {/* ── Edit modals ───────────────────────────────────────────────────── */}

      {activeModal === 'company' && (
        <EditModal
          title="Thông tin doanh nghiệp"
          onCancel={closeModal}
          onSave={saveCompany}
          isSaving={isSaving}
        >
          <ModalInput label="Tên công ty" value={companyName} onChange={setCompanyName} />
          <ModalInput label="Tỉnh / Vùng hoạt động" value={region} onChange={setRegion} />
        </EditModal>
      )}

      {activeModal === 'contact' && (
        <EditModal
          title="Liên hệ"
          onCancel={closeModal}
          onSave={saveContact}
          isSaving={isSaving}
        >
          <ModalInput label="Số điện thoại" value={phone} onChange={setPhone} type="tel" />
        </EditModal>
      )}

      {activeModal === 'capacity' && (
        <EditModal
          title="Năng lực thu mua"
          onCancel={closeModal}
          onSave={saveCapacity}
          isSaving={isSaving}
        >
          <ModalInput label="Năng lực thu mua (VD: 50 tấn/tháng)" value={capacity} onChange={setCapacity} />
          <Text size="small" style={{ color: 'rgba(0,0,0,0.6)', marginBottom: spacing.xs, marginTop: spacing.sm, fontWeight: fontWeight.semibold, display: 'block' }}>
            Loại nông sản thu mua
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
            {Object.entries(CROP_LABELS).map(([value, label]) => {
              const checked = purchasedCropTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPurchasedCropTypes((prev) =>
                    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
                  )}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: checked ? primaryColors.agriGreen : 'transparent',
                    color: checked ? '#fff' : primaryColors.agriGreen,
                    border: `1px solid ${primaryColors.agriGreen}`,
                    borderRadius: 16,
                    fontSize: fontSize.caption,
                    fontWeight: fontWeight.medium,
                    cursor: 'pointer',
                    minHeight: 36,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </EditModal>
      )}

      {activeModal === 'security' && (
        <InfoModal
          title="Bảo mật"
          message="Mật khẩu được quản lý bởi Zalo. Để thay đổi mật khẩu, vui lòng vào Cài đặt Zalo."
          onClose={closeModal}
        />
      )}

      {/* ── Reviews overlay ───────────────────────────────────────────────── */}
      {showReviews && (
        <ReviewsOverlay
          traderId={profile.userId}
          onClose={() => setShowReviews(false)}
        />
      )}

      {/* ── Public preview modal ──────────────────────────────────────────── */}
      {showPublicPreview && (
        <PublicPreviewModal
          profile={profile}
          liveTrustScore={trustScore}
          onClose={() => setShowPublicPreview(false)}
        />
      )}
    </Box>
  );
}

// ── MenuRow ───────────────────────────────────────────────────────────────────

function MenuRow({
  icon,
  label,
  subLabel,
  onTap,
  danger = false,
  noChevron = false,
}: {
  icon: string;
  label: string;
  subLabel?: string;
  onTap: () => void;
  danger?: boolean;
  noChevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minHeight: 52,
        padding: `${spacing.sm} ${spacing.md}`,
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${backgroundColors.tertiary}`,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {/* Icon */}
      <Box
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: backgroundColors.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
          marginRight: spacing.sm,
        }}
      >
        {icon}
      </Box>

      {/* Label */}
      <Box style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize.caption,
            fontWeight: fontWeight.medium,
            color: danger ? functionalColors.alertRed : textColors.primary,
            display: 'block',
          }}
        >
          {label}
        </Text>
        {subLabel && (
          <Text
            style={{
              fontSize: fontSize.small,
              color: textColors.secondary,
              display: 'block',
            }}
          >
            {subLabel}
          </Text>
        )}
      </Box>

      {/* Chevron */}
      {!noChevron && (
        <Text style={{ fontSize: fontSize.small, color: textColors.secondary, marginLeft: spacing.xs }}>
          ›
        </Text>
      )}
    </button>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────

function EditModal({
  title,
  children,
  onCancel,
  onSave,
  isSaving,
}: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <Box
        style={{
          background: backgroundColors.primary,
          borderRadius: 16,
          padding: spacing.md,
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Text
          style={{
            fontSize: fontSize.h2,
            fontWeight: fontWeight.bold,
            color: textColors.primary,
            marginBottom: spacing.md,
            display: 'block',
          }}
        >
          {title}
        </Text>

        {children}

        <Box style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 10,
              background: backgroundColors.secondary,
              border: 'none',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
              color: textColors.secondary,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 10,
              background: primaryColors.zaloBlue,
              border: 'none',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
              color: '#fff',
              cursor: isSaving ? 'wait' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </Box>
      </Box>
    </ModalOverlay>
  );
}

// ── InfoModal ─────────────────────────────────────────────────────────────────

function InfoModal({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <ModalOverlay onClose={onClose}>
      <Box
        style={{
          background: backgroundColors.primary,
          borderRadius: 16,
          padding: spacing.md,
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Text
          style={{
            fontSize: fontSize.h2,
            fontWeight: fontWeight.bold,
            color: textColors.primary,
            marginBottom: spacing.sm,
            display: 'block',
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: fontSize.caption, color: textColors.secondary, lineHeight: 1.6 }}>
          {message}
        </Text>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: spacing.md,
            width: '100%',
            minHeight: 44,
            borderRadius: 10,
            background: primaryColors.zaloBlue,
            border: 'none',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Đã hiểu
        </button>
      </Box>
    </ModalOverlay>
  );
}

// ── PublicPreviewModal ────────────────────────────────────────────────────────

function PublicPreviewModal({
  profile,
  liveTrustScore,
  onClose,
}: {
  profile: UserProfileDto;
  liveTrustScore?: TrustScoreDto;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    marketplaceService
      .listProducts({ traderId: profile.userId, status: 'active', limit: 3 })
      .then((res) => {
        if (!cancelled) setProducts(res.items.slice(0, 3));
      })
      .catch(() => {
        // silently ignore — preview degrades gracefully
      })
      .then(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile.userId]);

  const initials = (profile.displayName ?? '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hasScore = liveTrustScore && liveTrustScore.count > 0 && liveTrustScore.average !== null;
  const stars = hasScore ? Math.round(liveTrustScore!.average!) : 0;

  return (
    // Full-screen overlay
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: spacing.xl,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      {/* Card */}
      <Box
        style={{
          background: backgroundColors.primary,
          borderRadius: 16,
          padding: spacing.md,
          width: 'calc(100% - 32px)',
          maxWidth: 360,
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: backgroundColors.secondary,
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: textColors.secondary,
          }}
        >
          ✕
        </button>

        <Text
          style={{
            fontSize: 11,
            fontWeight: fontWeight.semibold,
            color: primaryColors.zaloBlue,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
            display: 'block',
          }}
        >
          Giao diện công khai
        </Text>

        {/* Avatar */}
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: spacing.md }}>
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `${primaryColors.zaloBlue}22`,
              border: `3px solid ${primaryColors.zaloBlue}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: fontWeight.bold,
              color: primaryColors.zaloBlue,
              marginBottom: spacing.sm,
              overflow: 'hidden',
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              initials || '🏢'
            )}
          </Box>

          {/* Company name */}
          {profile.traderProfile?.companyName && (
            <Text
              style={{
                fontSize: fontSize.h2,
                fontWeight: fontWeight.bold,
                color: textColors.primary,
                textAlign: 'center',
                marginBottom: spacing.xs,
              }}
            >
              {profile.traderProfile.companyName}
            </Text>
          )}

          {/* Region chip */}
          {profile.traderProfile?.region && (
            <Box
              style={{
                background: `${primaryColors.zaloBlue}11`,
                border: `1px solid ${primaryColors.zaloBlue}33`,
                borderRadius: 99,
                padding: `${spacing.xs} ${spacing.sm}`,
                marginBottom: spacing.xs,
              }}
            >
              <Text style={{ fontSize: 12, color: primaryColors.zaloBlue, fontWeight: fontWeight.medium }}>
                {profile.traderProfile.region}
              </Text>
            </Box>
          )}

          {/* Trust score stars */}
          {hasScore ? (
            <Box style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Box style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text
                    key={s}
                    style={{
                      fontSize: 16,
                      color: s <= stars ? '#FACC15' : '#E5E7EB',
                    }}
                  >
                    ★
                  </Text>
                ))}
              </Box>
              <Text style={{ fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: textColors.secondary }}>
                {liveTrustScore!.average!.toFixed(1)}/5 ({liveTrustScore!.count})
              </Text>
            </Box>
          ) : (
            <Text style={{ fontSize: fontSize.caption, color: textColors.secondary }}>
              Chưa có đánh giá
            </Text>
          )}
        </Box>

        {/* Products section */}
        <Box>
          <Text
            style={{
              fontSize: fontSize.caption,
              fontWeight: fontWeight.bold,
              color: textColors.primary,
              marginBottom: spacing.sm,
              display: 'block',
            }}
          >
            Sản phẩm đang bán
          </Text>

          {loadingProducts ? (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  style={{
                    height: 40,
                    borderRadius: 8,
                    background: backgroundColors.secondary,
                  }}
                />
              ))}
            </Box>
          ) : products.length === 0 ? (
            <Text style={{ fontSize: fontSize.caption, color: textColors.secondary, textAlign: 'center', padding: spacing.md }}>
              Chưa có sản phẩm nào
            </Text>
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              {products.map((p) => (
                <Box
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: `${spacing.sm} ${spacing.sm}`,
                    background: backgroundColors.secondary,
                    borderRadius: 8,
                    minHeight: 44,
                  }}
                >
                  <Text style={{ fontSize: fontSize.caption, color: textColors.primary, fontWeight: fontWeight.medium }}>
                    {marketplaceService.cropEmoji(p.cropType)} {p.name}
                  </Text>
                  <Text style={{ fontSize: fontSize.caption, color: primaryColors.zaloBlue, fontWeight: fontWeight.semibold }}>
                    {p.price.toLocaleString('vi-VN')} đ/{p.unit}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── ReviewsOverlay ────────────────────────────────────────────────────────────

function ReviewsOverlay({ traderId, onClose }: { traderId: string; onClose: () => void }) {
  const { reviews, isLoading } = useTraderReviews(traderId);
  const session = useAtomValue(authSessionAtom);
  const currentUserId = session?.userId ?? '';
  const queryClient = useQueryClient();
  const openSnackbar = useStableOpenSnackbar();

  // FR-U01: chỉ tác giả mới sửa/xóa được review của mình.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const invalidateReviews = () => {
    void queryClient.invalidateQueries({ queryKey: ['trader-reviews', traderId] });
    void queryClient.invalidateQueries({ queryKey: ['trust-score', traderId] });
  };

  const startEdit = (id: string, rating: number, comment?: string) => {
    setEditingId(id);
    setEditRating(rating);
    setEditComment(comment ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditComment('');
  };

  const saveEdit = async (id: string) => {
    if (editRating === 0) return;
    setBusyId(id);
    try {
      await updateTraderReview(id, { rating: editRating, comment: editComment.trim() || undefined });
      invalidateReviews();
      cancelEdit();
      openSnackbar({ type: 'success', text: 'Đã cập nhật đánh giá.', duration: 2500, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toReviewViMessage(err), duration: 3500, icon: true });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Xóa đánh giá này?')) return;
    setBusyId(id);
    try {
      await deleteTraderReview(id);
      invalidateReviews();
      if (editingId === id) cancelEdit();
      openSnackbar({ type: 'success', text: 'Đã xóa đánh giá.', duration: 2500, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toReviewViMessage(err), duration: 3500, icon: true });
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('vi-VN');
    } catch {
      return iso;
    }
  };

  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: spacing.xl,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <Box
        style={{
          background: backgroundColors.primary,
          borderRadius: 16,
          padding: spacing.md,
          width: 'calc(100% - 32px)',
          maxWidth: 360,
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          marginBottom: spacing.xl,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.h2, fontWeight: fontWeight.bold, color: textColors.primary }}>
            Đánh giá từ người mua
          </Text>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: backgroundColors.secondary,
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textColors.secondary,
            }}
          >
            ✕
          </button>
        </Box>

        {isLoading ? (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} style={{ height: 56, borderRadius: 8, background: backgroundColors.secondary }} />
            ))}
          </Box>
        ) : reviews.length === 0 ? (
          <Text style={{ fontSize: fontSize.caption, color: textColors.secondary, textAlign: 'center', padding: spacing.lg }}>
            Chưa có đánh giá nào
          </Text>
        ) : (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {reviews.map((r) => {
              const isOwn = !!currentUserId && r.buyerId === currentUserId;
              const isEditing = editingId === r.id;
              const isBusy = busyId === r.id;
              return (
                <Box
                  key={r.id}
                  style={{
                    padding: spacing.sm,
                    background: backgroundColors.secondary,
                    borderRadius: 10,
                    border: isOwn ? `1.5px solid ${primaryColors.zaloBlue}40` : 'none',
                  }}
                >
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                    <Text style={{ fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: textColors.primary }}>
                      {isOwn ? 'Bạn' : r.buyerDisplayName ?? 'Người mua ẩn danh'}
                    </Text>
                    <Text style={{ fontSize: fontSize.small, color: textColors.secondary }}>
                      {formatDate(r.createdAt)}
                    </Text>
                  </Box>

                  {isEditing ? (
                    <>
                      <Box style={{ display: 'flex', gap: 2, marginBottom: spacing.xs }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            aria-label={`${s} sao`}
                            onClick={() => setEditRating(s)}
                            style={{
                              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                              minWidth: 44, minHeight: 44, fontSize: 24,
                              color: s <= editRating ? '#FACC15' : '#E5E7EB',
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </Box>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Nhận xét của bạn (tùy chọn)"
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                          border: `1.5px solid ${backgroundColors.tertiary}`, borderRadius: 8,
                          fontSize: fontSize.caption, color: textColors.primary, background: backgroundColors.primary,
                          resize: 'none', marginBottom: spacing.xs, fontFamily: 'inherit',
                        }}
                      />
                      <Box style={{ display: 'flex', gap: spacing.xs }}>
                        <button
                          type="button"
                          onClick={() => void saveEdit(r.id)}
                          disabled={editRating === 0 || isBusy}
                          style={{
                            flex: 1, minHeight: 40, borderRadius: 8, border: 'none',
                            background: primaryColors.zaloBlue, color: '#fff',
                            fontSize: fontSize.caption, fontWeight: fontWeight.semibold,
                            cursor: editRating === 0 || isBusy ? 'not-allowed' : 'pointer',
                            opacity: editRating === 0 || isBusy ? 0.5 : 1,
                          }}
                        >
                          {isBusy ? 'Đang lưu…' : 'Lưu'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isBusy}
                          style={{
                            flex: 1, minHeight: 40, borderRadius: 8, border: 'none',
                            background: backgroundColors.tertiary, color: textColors.secondary,
                            fontSize: fontSize.caption, fontWeight: fontWeight.semibold, cursor: 'pointer',
                          }}
                        >
                          Hủy
                        </button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box style={{ display: 'flex', gap: 2, marginBottom: spacing.xs }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Text key={s} style={{ fontSize: 14, color: s <= r.rating ? '#FACC15' : '#E5E7EB' }}>★</Text>
                        ))}
                      </Box>
                      {r.comment && (
                        <Text style={{ fontSize: fontSize.caption, color: textColors.secondary, lineHeight: 1.5 }}>
                          {r.comment}
                        </Text>
                      )}
                      {isOwn && (
                        <Box style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xs }}>
                          <button
                            type="button"
                            onClick={() => startEdit(r.id, r.rating, r.comment)}
                            disabled={isBusy}
                            style={{
                              minHeight: 36, padding: `0 ${spacing.md}`, borderRadius: 8,
                              background: 'transparent', border: `1px solid ${primaryColors.zaloBlue}`,
                              color: primaryColors.zaloBlue, fontSize: fontSize.small,
                              fontWeight: fontWeight.semibold, cursor: 'pointer',
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id)}
                            disabled={isBusy}
                            style={{
                              minHeight: 36, padding: `0 ${spacing.md}`, borderRadius: 8,
                              background: 'transparent', border: `1px solid ${functionalColors.alertRed}`,
                              color: functionalColors.alertRed, fontSize: fontSize.small,
                              fontWeight: fontWeight.semibold, cursor: 'pointer',
                            }}
                          >
                            {isBusy ? 'Đang xóa…' : 'Xóa'}
                          </button>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: spacing.md,
            width: '100%',
            minHeight: 44,
            borderRadius: 10,
            background: backgroundColors.secondary,
            border: 'none',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            color: textColors.secondary,
            cursor: 'pointer',
          }}
        >
          Đóng
        </button>
      </Box>
    </Box>
  );
}

// ── ModalOverlay ──────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
      }}
      onClick={onClose}
    >
      {children}
    </Box>
  );
}

// ── ModalInput ────────────────────────────────────────────────────────────────

function ModalInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  placeholder?: string;
}) {
  return (
    <Box style={{ marginBottom: spacing.sm }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: fontWeight.semibold,
          color: textColors.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.xs,
          display: 'block',
        }}
      >
        {label}
      </Text>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1.5px solid ${backgroundColors.tertiary}`,
          borderRadius: 8,
          fontSize: fontSize.caption,
          color: textColors.primary,
          background: backgroundColors.primary,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = primaryColors.zaloBlue; }}
        onBlur={(e) => { e.target.style.borderColor = backgroundColors.tertiary; }}
      />
    </Box>
  );
}
