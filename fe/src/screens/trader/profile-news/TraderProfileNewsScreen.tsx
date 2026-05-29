/**
 * Trader Profile & News Screen
 * Quản lý thương hiệu, tin tức thị trường và dự báo (mock — Phase 16.1)
 *
 * Requirements: FR-T01, FR-T12, US-T05
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Page, Text, Spinner } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  createForecast,
  createNews,
  listForecasts,
  listNews,
  updateForecast,
  updateNews,
  toNewsForecastViMessage,
  type ForecastDto,
  type ForecastPayload,
  type NewsArticleDto,
} from '../../../services/newsForecastService';
import { getMe, updateMe } from '@/services/authService';
import type { UserProfileDto } from '@/services/authService';
import { ApiError } from '@/api/errors';

export interface TraderProfileNewsScreenProps {
  /** Giữ tương thích ví dụ / tích hợp sau (hồ sơ mock hiện dùng companyName). */
  traderName?: string;
  companyName?: string;
  /** Khi nhúng vào hub: bỏ <Page> wrapper và header ngoài. */
  inTab?: boolean;
  /** Tab nội bộ mặc định khi nhúng trong hub. */
  defaultTab?: MainTab;
}

type MainTab = 'profile' | 'news' | 'forecasts';

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'price_forecast', label: 'Dự báo giá' },
  { value: 'weather_alert', label: 'Cảnh báo thời tiết' },
  { value: 'farming_technique', label: 'Kỹ thuật canh tác' },
];

function categoryLabel(cat: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat;
}

function formatIsoDate(iso: string): string {
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

// ── forecastData structured types ────────────────────────────────────────────

interface PriceSeriesRow { day: string; price: string }
interface DemandSeriesRow { day: string; demand: string }

interface ForecastDataFields {
  productLabel: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: string;
  priceSeries: PriceSeriesRow[];
  demandSeries: DemandSeriesRow[];
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  details: string;
}

const DEFAULT_FORECAST_FIELDS: ForecastDataFields = {
  productLabel: 'Nông sản',
  trend: 'stable',
  changePercent: '0',
  priceSeries: [
    { day: 'T2', price: '30' },
    { day: 'T3', price: '31' },
    { day: 'T4', price: '30' },
  ],
  demandSeries: [
    { day: 'T2', demand: '100' },
    { day: 'T3', demand: '110' },
    { day: 'T4', demand: '105' },
  ],
  description: '',
  riskLevel: 'low',
  details: '',
};

function buildForecastData(type: 'price' | 'demand' | 'weather', fields: ForecastDataFields): ForecastPayload {
  if (type === 'price') {
    return {
      productLabel: fields.productLabel,
      trend: fields.trend,
      changePercent: Number(fields.changePercent) || 0,
      series: fields.priceSeries.map((r) => ({ day: r.day, price: Number(r.price) || 0 })),
    };
  }
  if (type === 'demand') {
    return {
      productLabel: fields.productLabel,
      trend: fields.trend,
      changePercent: Number(fields.changePercent) || 0,
      series: fields.demandSeries.map((r) => ({ day: r.day, demand: Number(r.demand) || 0 })),
    };
  }
  return {
    description: fields.description,
    riskLevel: fields.riskLevel,
    details: fields.details,
  };
}

function parseForecastDataFields(type: 'price' | 'demand' | 'weather', data: unknown): ForecastDataFields {
  const base = { ...DEFAULT_FORECAST_FIELDS };
  if (!data || typeof data !== 'object') return base;
  const d = data as Record<string, unknown>;
  if (type === 'price') {
    const series = Array.isArray(d.series)
      ? (d.series as Array<Record<string, unknown>>).map((r) => ({ day: String(r.day ?? ''), price: String(r.price ?? '0') }))
      : base.priceSeries;
    return {
      ...base,
      productLabel: String(d.productLabel ?? base.productLabel),
      trend: (['up', 'down', 'stable'].includes(d.trend as string) ? d.trend : base.trend) as ForecastDataFields['trend'],
      changePercent: String(d.changePercent ?? '0'),
      priceSeries: series,
    };
  }
  if (type === 'demand') {
    const series = Array.isArray(d.series)
      ? (d.series as Array<Record<string, unknown>>).map((r) => ({ day: String(r.day ?? ''), demand: String(r.demand ?? '0') }))
      : base.demandSeries;
    return {
      ...base,
      productLabel: String(d.productLabel ?? base.productLabel),
      trend: (['up', 'down', 'stable'].includes(d.trend as string) ? d.trend : base.trend) as ForecastDataFields['trend'],
      changePercent: String(d.changePercent ?? '0'),
      demandSeries: series,
    };
  }
  return {
    ...base,
    description: String(d.description ?? ''),
    riskLevel: (['low', 'medium', 'high'].includes(d.riskLevel as string) ? d.riskLevel : base.riskLevel) as ForecastDataFields['riskLevel'],
    details: String(d.details ?? ''),
  };
}

export const TraderProfileNewsScreen: React.FC<TraderProfileNewsScreenProps> = ({
  traderName: _traderName,
  companyName = 'Công ty TNHH Nông sản Sầu riêng Monthong',
  inTab,
  defaultTab,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState<MainTab>(defaultTab ?? 'profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isWritingArticle, setIsWritingArticle] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [articles, setArticles] = useState<NewsArticleDto[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const [forecasts, setForecasts] = useState<ForecastDto[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [isWritingForecast, setIsWritingForecast] = useState(false);
  const [editingForecastId, setEditingForecastId] = useState<string | null>(null);

  // Hồ sơ công ty — sync với GET/PUT /auth/me. Trường được lưu trên server:
  //   name → traderProfile.companyName
  //   address → traderProfile.region
  //   capacity → traderProfile.capacity
  //   phone → user.phone
  //   email → user.email
  // Trường UI-only (chưa có API): logo, license, description.
  const [companyProfile, setCompanyProfile] = useState({
    logo: '🏢',
    name: companyName,
    license: '',
    description: '',
    address: '',
    capacity: '',
    phone: '',
    email: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [trustScore, setTrustScore] = useState<number | null>(null);

  // Load hồ sơ thật khi mở tab "Doanh nghiệp"
  useEffect(() => {
    if (activeTab !== 'profile') return;
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      try {
        const me: UserProfileDto = await getMe();
        if (cancelled) return;
        setCompanyProfile((prev) => ({
          ...prev,
          name: me.traderProfile?.companyName ?? me.displayName ?? prev.name,
          address: me.traderProfile?.region ?? '',
          capacity: me.traderProfile?.capacity ?? '',
          phone: me.phone ?? '',
          email: me.email ?? '',
        }));
        setTrustScore(me.traderProfile?.trustScore ?? null);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message || 'Không tải được hồ sơ doanh nghiệp.'
            : 'Không tải được hồ sơ doanh nghiệp.';
        openSnackbar({ type: 'error', text: message, duration: 4000, icon: true });
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, openSnackbar]);

  const [newArticle, setNewArticle] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'price_forecast',
    imageUrl: '',
  });

  const [forecastForm, setForecastForm] = useState({
    region: 'mekong_delta',
    cropType: 'pomelo',
    type: 'price' as 'price' | 'demand' | 'weather',
    validFrom: '',
    validTo: '',
  });

  const [forecastDataFields, setForecastDataFields] = useState<ForecastDataFields>(DEFAULT_FORECAST_FIELDS);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await listNews({ page: 1, limit: 50 });
      setArticles(res.items);
    } catch (e: unknown) {
      openSnackbar({
        type: 'error',
        text: toNewsForecastViMessage(e, 'newsList'),
        duration: 4000,
        icon: true,
      });
    } finally {
      setNewsLoading(false);
    }
  }, [openSnackbar]);

  const loadForecasts = useCallback(async () => {
    setForecastLoading(true);
    try {
      const res = await listForecasts({ page: 1, limit: 50 });
      setForecasts(res.items);
    } catch (e: unknown) {
      openSnackbar({
        type: 'error',
        text: toNewsForecastViMessage(e, 'forecastList'),
        duration: 4000,
        icon: true,
      });
    } finally {
      setForecastLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    if (activeTab === 'news') void loadNews();
  }, [activeTab, loadNews]);

  useEffect(() => {
    if (activeTab === 'forecasts') void loadForecasts();
  }, [activeTab, loadForecasts]);

  const resetArticleForm = () => {
    setNewArticle({
      title: '',
      summary: '',
      content: '',
      category: 'price_forecast',
      imageUrl: '',
    });
    setEditingArticleId(null);
    setIsWritingArticle(false);
  };

  const startEditArticle = (a: NewsArticleDto) => {
    setEditingArticleId(a.id);
    setNewArticle({
      title: a.title,
      summary: a.summary,
      content: a.content,
      category: a.category,
      imageUrl: a.imageUrl ?? '',
    });
    setIsWritingArticle(true);
  };

  const handlePublishArticle = async () => {
    if (!newArticle.title.trim() || !newArticle.summary.trim() || !newArticle.content.trim()) {
      openSnackbar({ type: 'error', text: 'Vui lòng nhập đủ tiêu đề, tóm tắt và nội dung', duration: 3000 });
      return;
    }
    try {
      if (editingArticleId) {
        await updateNews(editingArticleId, {
          title: newArticle.title,
          summary: newArticle.summary,
          content: newArticle.content,
          category: newArticle.category,
          imageUrl: newArticle.imageUrl || undefined,
        });
        openSnackbar({ type: 'success', text: 'Đã cập nhật bài viết', duration: 2500 });
      } else {
        await createNews({
          title: newArticle.title,
          summary: newArticle.summary,
          content: newArticle.content,
          category: newArticle.category,
          imageUrl: newArticle.imageUrl || undefined,
        });
        openSnackbar({ type: 'success', text: 'Đã đăng bài', duration: 2500 });
      }
      resetArticleForm();
      await loadNews();
    } catch (e: unknown) {
      openSnackbar({
        type: 'error',
        text: toNewsForecastViMessage(e, editingArticleId ? 'newsUpdate' : 'newsCreate'),
        duration: 4000,
        icon: true,
      });
    }
  };

  const resetForecastForm = () => {
    setForecastForm({
      region: 'mekong_delta',
      cropType: 'pomelo',
      type: 'price',
      validFrom: '',
      validTo: '',
    });
    setForecastDataFields(DEFAULT_FORECAST_FIELDS);
    setEditingForecastId(null);
    setIsWritingForecast(false);
  };

  const startEditForecast = (f: ForecastDto) => {
    setEditingForecastId(f.id);
    setForecastForm({
      region: f.region,
      cropType: f.cropType,
      type: f.type,
      validFrom: f.validFrom.slice(0, 16),
      validTo: f.validTo.slice(0, 16),
    });
    setForecastDataFields(parseForecastDataFields(f.type, f.forecastData));
    setIsWritingForecast(true);
  };

  const handleSaveForecast = async () => {
    if (!forecastForm.validFrom || !forecastForm.validTo) {
      openSnackbar({ type: 'error', text: 'Chọn khoảng hiệu lực (từ — đến)', duration: 3000 });
      return;
    }
    const forecastData = buildForecastData(forecastForm.type, forecastDataFields);
    const validFrom = new Date(forecastForm.validFrom).toISOString();
    const validTo = new Date(forecastForm.validTo).toISOString();
    try {
      if (editingForecastId) {
        await updateForecast(editingForecastId, {
          region: forecastForm.region,
          cropType: forecastForm.cropType,
          type: forecastForm.type,
          forecastData,
          validFrom,
          validTo,
        });
        openSnackbar({ type: 'success', text: 'Đã cập nhật dự báo', duration: 2500 });
      } else {
        await createForecast({
          region: forecastForm.region,
          cropType: forecastForm.cropType,
          type: forecastForm.type,
          forecastData,
          validFrom,
          validTo,
        });
        openSnackbar({ type: 'success', text: 'Đã tạo dự báo', duration: 2500 });
      }
      resetForecastForm();
      await loadForecasts();
    } catch (e: unknown) {
      openSnackbar({
        type: 'error',
        text: toNewsForecastViMessage(e, editingForecastId ? 'forecastUpdate' : 'forecastCreate'),
        duration: 4000,
        icon: true,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (profileSaving) return;
    setProfileSaving(true);
    try {
      const updated = await updateMe({
        phone: companyProfile.phone || undefined,
        email: companyProfile.email || undefined,
        traderProfile: {
          companyName: companyProfile.name,
          region: companyProfile.address,
          capacity: companyProfile.capacity,
          // trustScore chỉ đọc, không cập nhật từ FE
          trustScore: trustScore ?? 0,
        },
      });
      setCompanyProfile((prev) => ({
        ...prev,
        name: updated.traderProfile?.companyName ?? prev.name,
        address: updated.traderProfile?.region ?? prev.address,
        capacity: updated.traderProfile?.capacity ?? prev.capacity,
        phone: updated.phone ?? '',
        email: updated.email ?? '',
      }));
      setTrustScore(updated.traderProfile?.trustScore ?? trustScore);
      setIsEditing(false);
      openSnackbar({ type: 'success', text: 'Đã cập nhật hồ sơ doanh nghiệp', duration: 2500 });
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message || 'Lưu hồ sơ thất bại. Vui lòng thử lại.'
          : 'Lưu hồ sơ thất bại. Vui lòng thử lại.';
      openSnackbar({ type: 'error', text: message, duration: 4000, icon: true });
    } finally {
      setProfileSaving(false);
    }
  };

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const tabContainerStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.secondary,
    padding: spacing.xs,
    margin: spacing.md,
    borderRadius: '8px',
    flexWrap: 'wrap',
    gap: spacing.xs,
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: '1 1 28%',
    minWidth: '90px',
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isActive ? colors.background.primary : 'transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.small,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    transition: 'all 0.2s',
  });

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  };

  const profileCardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.lg,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.md,
  };

  const logoContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    backgroundColor: colors.background.secondary,
    borderRadius: '12px',
    fontSize: '48px',
    marginBottom: spacing.md,
  };

  const fieldStyles: React.CSSProperties = {
    marginBottom: spacing.md,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    display: 'block',
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.sm,
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '6px',
    fontSize: fontSize.body,
    backgroundColor: colors.background.primary,
  };

  const textareaStyles: React.CSSProperties = {
    ...inputStyles,
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit',
  };

  const buttonStyles = (variant: 'primary' | 'secondary' | 'outline'): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor:
      variant === 'primary' ? colors.primary.zaloBlue : variant === 'secondary' ? colors.primary.agriGreen : 'transparent',
    color: variant === 'outline' ? colors.text.primary : colors.text.inverse,
    border: variant === 'outline' ? `1px solid ${colors.background.tertiary}` : 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  });

  const articleCardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.md,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.md,
  };

  const categoryBadgeStyles = (category: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor:
      category === 'price_forecast'
        ? `${colors.primary.zaloBlue}15`
        : category === 'weather_alert'
          ? `${colors.functional.warningYellow}35`
          : `${colors.primary.agriGreen}15`,
    color:
      category === 'price_forecast'
        ? colors.primary.zaloBlue
        : category === 'weather_alert'
          ? colors.text.primary
          : colors.primary.agriGreen,
    borderRadius: '6px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
  });

  const statItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    color: colors.text.secondary,
    fontSize: fontSize.small,
  };

  const innerContent = (
    <>
      <div style={tabContainerStyles}>
        <button type="button" style={tabButtonStyles(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>
          Doanh nghiệp
        </button>
        <button type="button" style={tabButtonStyles(activeTab === 'news')} onClick={() => setActiveTab('news')}>
          Tin tức
        </button>
        <button type="button" style={tabButtonStyles(activeTab === 'forecasts')} onClick={() => setActiveTab('forecasts')}>
          Dự báo
        </button>
      </div>

      <div style={contentStyles}>
        {activeTab === 'profile' && (
          <div>
            <div style={profileCardStyles}>
              <div style={logoContainerStyles}>{companyProfile.logo}</div>

              <div style={fieldStyles}>
                <label style={labelStyles}>Tên đơn vị</label>
                {isEditing ? (
                  <input
                    type="text"
                    style={inputStyles}
                    value={companyProfile.name}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                  />
                ) : (
                  <Text.Title size="normal" style={{ margin: 0 }}>
                    {companyProfile.name}
                  </Text.Title>
                )}
              </div>

              <div style={fieldStyles}>
                <label style={labelStyles}>Giấy phép kinh doanh</label>
                {isEditing ? (
                  <input
                    type="text"
                    style={inputStyles}
                    value={companyProfile.license}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, license: e.target.value })}
                  />
                ) : (
                  <Text style={{ margin: 0 }}>{companyProfile.license}</Text>
                )}
              </div>

              <div style={fieldStyles}>
                <label style={labelStyles}>Mô tả năng lực</label>
                {isEditing ? (
                  <textarea
                    style={textareaStyles}
                    value={companyProfile.description}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, description: e.target.value })}
                  />
                ) : (
                  <Text style={{ margin: 0, lineHeight: 1.6 }}>{companyProfile.description}</Text>
                )}
              </div>

              <div style={fieldStyles}>
                <label style={labelStyles}>Địa chỉ</label>
                {isEditing ? (
                  <input
                    type="text"
                    style={inputStyles}
                    value={companyProfile.address}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                  />
                ) : (
                  <Text style={{ margin: 0 }}>{companyProfile.address}</Text>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <div style={fieldStyles}>
                  <label style={labelStyles}>Số điện thoại</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      style={inputStyles}
                      value={companyProfile.phone}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                    />
                  ) : (
                    <Text style={{ margin: 0 }}>{companyProfile.phone}</Text>
                  )}
                </div>
                <div style={fieldStyles}>
                  <label style={labelStyles}>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      style={inputStyles}
                      value={companyProfile.email}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                    />
                  ) : (
                    <Text style={{ margin: 0 }}>{companyProfile.email}</Text>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      style={buttonStyles('primary')}
                      onClick={() => void handleSaveProfile()}
                      disabled={profileSaving}
                    >
                      <Icon name="check" size="sm" color={colors.text.inverse} />
                      {profileSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      style={buttonStyles('outline')}
                      onClick={() => setIsEditing(false)}
                      disabled={profileSaving}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    style={buttonStyles('primary')}
                    onClick={() => setIsEditing(true)}
                    disabled={profileLoading}
                  >
                    <Icon name="edit" size="sm" color={colors.text.inverse} />
                    {profileLoading ? 'Đang tải…' : 'Chỉnh sửa thông tin'}
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                padding: spacing.md,
                backgroundColor: `${colors.primary.zaloBlue}10`,
                borderRadius: '8px',
                border: `1px solid ${colors.primary.zaloBlue}30`,
              }}
            >
              <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Icon name="info" size="md" color={colors.primary.zaloBlue} />
                <div>
                  <Text style={{ margin: 0, fontSize: fontSize.caption, fontWeight: fontWeight.medium }}>
                    Thông tin công khai
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    Thông tin này sẽ hiển thị công khai cho Nông dân và Người mua khi họ xem hồ sơ của bạn.
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            {newsLoading && articles.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xxl }}>
                <Spinner />
              </div>
            ) : null}

            {!isWritingArticle ? (
              <button
                type="button"
                style={{
                  ...buttonStyles('primary'),
                  width: '100%',
                  justifyContent: 'center',
                  marginBottom: spacing.lg,
                }}
                onClick={() => {
                  resetArticleForm();
                  setIsWritingArticle(true);
                }}
              >
                <Icon name="edit" size="md" color={colors.text.inverse} />
                Viết bài mới
              </button>
            ) : (
              <div style={profileCardStyles}>
                <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                  {editingArticleId ? 'Sửa bài viết' : 'Viết bài mới'}
                </Text.Title>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Danh mục</label>
                  <select
                    style={inputStyles}
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Tiêu đề</label>
                  <input
                    type="text"
                    style={inputStyles}
                    placeholder="Nhập tiêu đề bài viết..."
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  />
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Tóm tắt (summary)</label>
                  <textarea
                    style={{ ...textareaStyles, minHeight: '72px' }}
                    placeholder="Mô tả ngắn hiển thị trên danh sách..."
                    value={newArticle.summary}
                    onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                  />
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Nội dung</label>
                  <textarea
                    style={{ ...textareaStyles, minHeight: '200px' }}
                    placeholder="Nhập nội dung bài viết..."
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  />
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Ảnh đại diện (URL hoặc emoji tùy chọn)</label>
                  <input
                    type="text"
                    style={inputStyles}
                    placeholder="https://... hoặc 📊"
                    value={newArticle.imageUrl}
                    onChange={(e) => setNewArticle({ ...newArticle, imageUrl: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: spacing.md }}>
                  <button type="button" style={buttonStyles('primary')} onClick={() => void handlePublishArticle()}>
                    <Icon name="check" size="sm" color={colors.text.inverse} />
                    {editingArticleId ? 'Cập nhật' : 'Đăng bài'}
                  </button>
                  <button type="button" style={buttonStyles('outline')} onClick={resetArticleForm}>
                    Hủy
                  </button>
                </div>
              </div>
            )}

            <div>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Bài đã đăng ({articles.length})
              </Text.Title>

              {articles.map((article) => (
                <div key={article.id} style={articleCardStyles}>
                  <div style={{ marginBottom: spacing.sm, display: 'flex', justifyContent: 'space-between', gap: spacing.sm }}>
                    <span style={categoryBadgeStyles(article.category)}>{categoryLabel(article.category)}</span>
                    <button
                      type="button"
                      style={{ ...buttonStyles('outline'), padding: `${spacing.xs} ${spacing.sm}`, fontSize: fontSize.small }}
                      onClick={() => startEditArticle(article)}
                    >
                      Sửa
                    </button>
                  </div>

                  <div style={{ fontSize: '28px', marginBottom: spacing.xs }}>{article.imageUrl ?? '📰'}</div>

                  <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.xs }}>
                    {article.title}
                  </Text.Title>

                  <Text
                    size="small"
                    style={{
                      color: colors.text.secondary,
                      margin: 0,
                      marginBottom: spacing.sm,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {article.summary}
                  </Text>

                  <div style={statItemStyles}>
                    <Icon name="calendar" size="sm" color={colors.text.secondary} />
                    <span>{formatIsoDate(article.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'forecasts' && (
          <div>
            {forecastLoading && forecasts.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xxl }}>
                <Spinner />
              </div>
            ) : null}

            {!isWritingForecast ? (
              <button
                type="button"
                style={{
                  ...buttonStyles('secondary'),
                  width: '100%',
                  justifyContent: 'center',
                  marginBottom: spacing.lg,
                }}
                onClick={() => {
                  resetForecastForm();
                  const now = new Date();
                  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  setForecastForm((f) => ({
                    ...f,
                    validFrom: now.toISOString().slice(0, 16),
                    validTo: week.toISOString().slice(0, 16),
                  }));
                  setIsWritingForecast(true);
                }}
              >
                <Icon name="edit" size="md" color={colors.text.inverse} />
                Thêm dự báo
              </button>
            ) : (
              <div style={profileCardStyles}>
                <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                  {editingForecastId ? 'Sửa dự báo' : 'Dự báo mới'}
                </Text.Title>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Vùng</label>
                  <input
                    type="text"
                    style={inputStyles}
                    placeholder="VD: mekong_delta"
                    value={forecastForm.region}
                    onChange={(e) => setForecastForm({ ...forecastForm, region: e.target.value })}
                  />
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Cây trồng</label>
                  <input
                    type="text"
                    style={inputStyles}
                    placeholder="VD: pomelo"
                    value={forecastForm.cropType}
                    onChange={(e) => setForecastForm({ ...forecastForm, cropType: e.target.value })}
                  />
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Loại dự báo</label>
                  <select
                    style={inputStyles}
                    value={forecastForm.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'price' | 'demand' | 'weather';
                      setForecastForm({ ...forecastForm, type: newType });
                      setForecastDataFields(DEFAULT_FORECAST_FIELDS);
                    }}
                  >
                    <option value="price">Dự báo giá</option>
                    <option value="demand">Dự báo nhu cầu</option>
                    <option value="weather">Dự báo thời tiết</option>
                  </select>
                </div>

                {/* ── Structured forecastData inputs by type ── */}

                {forecastForm.type !== 'weather' && (
                  <>
                    <div style={fieldStyles}>
                      <label style={labelStyles}>Tên sản phẩm</label>
                      <input
                        type="text"
                        style={inputStyles}
                        placeholder="VD: Bưởi da xanh"
                        value={forecastDataFields.productLabel}
                        onChange={(e) => setForecastDataFields({ ...forecastDataFields, productLabel: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                      <div style={fieldStyles}>
                        <label style={labelStyles}>Xu hướng</label>
                        <select
                          style={inputStyles}
                          value={forecastDataFields.trend}
                          onChange={(e) =>
                            setForecastDataFields({ ...forecastDataFields, trend: e.target.value as ForecastDataFields['trend'] })
                          }
                        >
                          <option value="up">↑ Tăng</option>
                          <option value="down">↓ Giảm</option>
                          <option value="stable">→ Ổn định</option>
                        </select>
                      </div>
                      <div style={fieldStyles}>
                        <label style={labelStyles}>Thay đổi (%)</label>
                        <input
                          type="number"
                          style={inputStyles}
                          placeholder="VD: 5"
                          value={forecastDataFields.changePercent}
                          onChange={(e) => setForecastDataFields({ ...forecastDataFields, changePercent: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {forecastForm.type === 'price' && (
                  <div style={fieldStyles}>
                    <label style={labelStyles}>Chuỗi giá theo ngày (nghìn đồng/kg)</label>
                    {forecastDataFields.priceSeries.map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xs, alignItems: 'center' }}>
                        <input
                          type="text"
                          style={{ ...inputStyles, width: '80px', flex: '0 0 80px' }}
                          placeholder="Ngày"
                          value={row.day}
                          onChange={(e) => {
                            const next = forecastDataFields.priceSeries.map((r, i) => i === idx ? { ...r, day: e.target.value } : r);
                            setForecastDataFields({ ...forecastDataFields, priceSeries: next });
                          }}
                        />
                        <input
                          type="number"
                          style={{ ...inputStyles, flex: 1 }}
                          placeholder="Giá"
                          value={row.price}
                          onChange={(e) => {
                            const next = forecastDataFields.priceSeries.map((r, i) => i === idx ? { ...r, price: e.target.value } : r);
                            setForecastDataFields({ ...forecastDataFields, priceSeries: next });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForecastDataFields({
                              ...forecastDataFields,
                              priceSeries: forecastDataFields.priceSeries.filter((_, i) => i !== idx),
                            })
                          }
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing.xs, color: colors.functional.alertRed, fontSize: '18px', lineHeight: 1 }}
                          aria-label="Xóa hàng"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      style={{ ...buttonStyles('outline'), fontSize: fontSize.small, padding: `${spacing.xs} ${spacing.sm}`, marginTop: spacing.xs }}
                      onClick={() =>
                        setForecastDataFields({ ...forecastDataFields, priceSeries: [...forecastDataFields.priceSeries, { day: '', price: '' }] })
                      }
                    >
                      + Thêm ngày
                    </button>
                  </div>
                )}

                {forecastForm.type === 'demand' && (
                  <div style={fieldStyles}>
                    <label style={labelStyles}>Nhu cầu theo ngày (tấn)</label>
                    {forecastDataFields.demandSeries.map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xs, alignItems: 'center' }}>
                        <input
                          type="text"
                          style={{ ...inputStyles, width: '80px', flex: '0 0 80px' }}
                          placeholder="Ngày"
                          value={row.day}
                          onChange={(e) => {
                            const next = forecastDataFields.demandSeries.map((r, i) => i === idx ? { ...r, day: e.target.value } : r);
                            setForecastDataFields({ ...forecastDataFields, demandSeries: next });
                          }}
                        />
                        <input
                          type="number"
                          style={{ ...inputStyles, flex: 1 }}
                          placeholder="Nhu cầu"
                          value={row.demand}
                          onChange={(e) => {
                            const next = forecastDataFields.demandSeries.map((r, i) => i === idx ? { ...r, demand: e.target.value } : r);
                            setForecastDataFields({ ...forecastDataFields, demandSeries: next });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForecastDataFields({
                              ...forecastDataFields,
                              demandSeries: forecastDataFields.demandSeries.filter((_, i) => i !== idx),
                            })
                          }
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing.xs, color: colors.functional.alertRed, fontSize: '18px', lineHeight: 1 }}
                          aria-label="Xóa hàng"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      style={{ ...buttonStyles('outline'), fontSize: fontSize.small, padding: `${spacing.xs} ${spacing.sm}`, marginTop: spacing.xs }}
                      onClick={() =>
                        setForecastDataFields({ ...forecastDataFields, demandSeries: [...forecastDataFields.demandSeries, { day: '', demand: '' }] })
                      }
                    >
                      + Thêm ngày
                    </button>
                  </div>
                )}

                {forecastForm.type === 'weather' && (
                  <>
                    <div style={fieldStyles}>
                      <label style={labelStyles}>Mô tả ngắn</label>
                      <input
                        type="text"
                        style={inputStyles}
                        placeholder="VD: Mưa lớn kéo dài 3 ngày"
                        value={forecastDataFields.description}
                        onChange={(e) => setForecastDataFields({ ...forecastDataFields, description: e.target.value })}
                      />
                    </div>
                    <div style={fieldStyles}>
                      <label style={labelStyles}>Mức độ rủi ro</label>
                      <select
                        style={inputStyles}
                        value={forecastDataFields.riskLevel}
                        onChange={(e) =>
                          setForecastDataFields({ ...forecastDataFields, riskLevel: e.target.value as ForecastDataFields['riskLevel'] })
                        }
                      >
                        <option value="low">🟢 Thấp</option>
                        <option value="medium">🟡 Trung bình</option>
                        <option value="high">🔴 Cao</option>
                      </select>
                    </div>
                    <div style={fieldStyles}>
                      <label style={labelStyles}>Chi tiết</label>
                      <textarea
                        style={{ ...textareaStyles, minHeight: '100px' }}
                        placeholder="Mô tả chi tiết điều kiện thời tiết và khuyến nghị..."
                        value={forecastDataFields.details}
                        onChange={(e) => setForecastDataFields({ ...forecastDataFields, details: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                  <div style={fieldStyles}>
                    <label style={labelStyles}>Hiệu lực từ</label>
                    <input
                      type="datetime-local"
                      style={inputStyles}
                      value={forecastForm.validFrom}
                      onChange={(e) => setForecastForm({ ...forecastForm, validFrom: e.target.value })}
                    />
                  </div>
                  <div style={fieldStyles}>
                    <label style={labelStyles}>Đến</label>
                    <input
                      type="datetime-local"
                      style={inputStyles}
                      value={forecastForm.validTo}
                      onChange={(e) => setForecastForm({ ...forecastForm, validTo: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: spacing.md }}>
                  <button type="button" style={buttonStyles('primary')} onClick={() => void handleSaveForecast()}>
                    <Icon name="check" size="sm" color={colors.text.inverse} />
                    {editingForecastId ? 'Cập nhật' : 'Lưu'}
                  </button>
                  <button type="button" style={buttonStyles('outline')} onClick={resetForecastForm}>
                    Hủy
                  </button>
                </div>
              </div>
            )}

            <Text.Title size="small" style={{ marginBottom: spacing.md }}>
              Danh sách dự báo ({forecasts.length})
            </Text.Title>

            {forecasts.map((f) => {
              const parsed = parseForecastDataFields(f.type, f.forecastData);
              const typeViLabel =
                f.type === 'price' ? 'Dự báo giá' : f.type === 'demand' ? 'Dự báo nhu cầu' : 'Dự báo thời tiết';
              const typeBg =
                f.type === 'price'
                  ? `${colors.primary.zaloBlue}15`
                  : f.type === 'demand'
                    ? `${colors.primary.agriGreen}15`
                    : `${colors.functional.warningYellow}35`;
              const typeColor =
                f.type === 'price'
                  ? colors.primary.zaloBlue
                  : f.type === 'demand'
                    ? colors.primary.agriGreen
                    : colors.text.primary;
              return (
                <div key={f.id} style={articleCardStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <div>
                      <Text.Title size="small" style={{ margin: 0, marginBottom: '4px' }}>
                        {f.cropType} · {f.region}
                      </Text.Title>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: `2px ${spacing.sm}`,
                          backgroundColor: typeBg,
                          color: typeColor,
                          borderRadius: '4px',
                          fontSize: fontSize.small,
                          fontWeight: fontWeight.medium,
                        }}
                      >
                        {typeViLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      style={{ ...buttonStyles('outline'), padding: `${spacing.xs} ${spacing.sm}`, fontSize: fontSize.small, flexShrink: 0 }}
                      onClick={() => startEditForecast(f)}
                    >
                      Sửa
                    </button>
                  </div>

                  {f.type !== 'weather' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.background.secondary,
                        borderRadius: '6px',
                        marginBottom: spacing.sm,
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>
                        {parsed.trend === 'up' ? '↑' : parsed.trend === 'down' ? '↓' : '→'}
                      </span>
                      <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                        {parsed.productLabel}
                      </Text>
                      {Number(parsed.changePercent) !== 0 && (
                        <Text
                          size="small"
                          style={{
                            margin: 0,
                            color:
                              parsed.trend === 'up'
                                ? colors.primary.agriGreen
                                : parsed.trend === 'down'
                                  ? colors.functional.alertRed
                                  : colors.text.secondary,
                          }}
                        >
                          {Number(parsed.changePercent) > 0 ? '+' : ''}{parsed.changePercent}%
                        </Text>
                      )}
                    </div>
                  )}

                  {f.type === 'weather' && (parsed.description || parsed.riskLevel) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.background.secondary,
                        borderRadius: '6px',
                        marginBottom: spacing.sm,
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>
                        {parsed.riskLevel === 'high' ? '🔴' : parsed.riskLevel === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <Text size="small" style={{ margin: 0 }}>
                        {parsed.description || (parsed.riskLevel === 'high' ? 'Rủi ro cao' : parsed.riskLevel === 'medium' ? 'Rủi ro trung bình' : 'Rủi ro thấp')}
                      </Text>
                    </div>
                  )}

                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    {formatIsoDate(f.validFrom)} — {formatIsoDate(f.validTo)}
                  </Text>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  if (inTab) return <div style={{ flex: 1, overflowY: 'auto' }}>{innerContent}</div>;
  return (
    <Page className="trader-profile-news-screen">
      <div style={headerStyles}>
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Quản lý
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          Hồ sơ & Tin tức
        </Text.Title>
      </div>
      {innerContent}
    </Page>
  );
};

export default TraderProfileNewsScreen;
