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
  type NewsArticleDto,
} from '../../../services/newsForecastService';
import { getMe, updateMe } from '@/services/authService';
import type { UserProfileDto } from '@/services/authService';
import { ApiError } from '@/api/errors';

export interface TraderProfileNewsScreenProps {
  /** Giữ tương thích ví dụ / tích hợp sau (hồ sơ mock hiện dùng companyName). */
  traderName?: string;
  companyName?: string;
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

export const TraderProfileNewsScreen: React.FC<TraderProfileNewsScreenProps> = ({
  traderName: _traderName,
  companyName = 'Công ty TNHH Nông sản Sầu riêng Monthong',
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState<MainTab>('profile');
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

  const defaultPriceForecastJson = () =>
    JSON.stringify(
      {
        productLabel: 'Nông sản',
        trend: 'stable',
        changePercent: 0,
        series: [
          { day: 'T2', price: 30 },
          { day: 'T3', price: 31 },
          { day: 'T4', price: 30 },
        ],
      },
      null,
      2,
    );

  const [forecastForm, setForecastForm] = useState({
    region: 'mekong_delta',
    cropType: 'pomelo',
    type: 'price' as 'price' | 'demand' | 'weather',
    forecastDataJson: defaultPriceForecastJson(),
    validFrom: '',
    validTo: '',
  });

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
      forecastDataJson: defaultPriceForecastJson(),
      validFrom: '',
      validTo: '',
    });
    setEditingForecastId(null);
    setIsWritingForecast(false);
  };

  const startEditForecast = (f: ForecastDto) => {
    setEditingForecastId(f.id);
    setForecastForm({
      region: f.region,
      cropType: f.cropType,
      type: f.type,
      forecastDataJson: JSON.stringify(f.forecastData, null, 2),
      validFrom: f.validFrom.slice(0, 16),
      validTo: f.validTo.slice(0, 16),
    });
    setIsWritingForecast(true);
  };

  const handleSaveForecast = async () => {
    if (!forecastForm.validFrom || !forecastForm.validTo) {
      openSnackbar({ type: 'error', text: 'Chọn khoảng hiệu lực (từ — đến)', duration: 3000 });
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(forecastForm.forecastDataJson);
    } catch {
      openSnackbar({ type: 'error', text: 'forecastData không phải JSON hợp lệ', duration: 3000 });
      return;
    }
    const validFrom = new Date(forecastForm.validFrom).toISOString();
    const validTo = new Date(forecastForm.validTo).toISOString();
    try {
      if (editingForecastId) {
        await updateForecast(editingForecastId, {
          region: forecastForm.region,
          cropType: forecastForm.cropType,
          type: forecastForm.type,
          forecastData: parsed,
          validFrom,
          validTo,
        });
        openSnackbar({ type: 'success', text: 'Đã cập nhật dự báo', duration: 2500 });
      } else {
        await createForecast({
          region: forecastForm.region,
          cropType: forecastForm.cropType,
          type: forecastForm.type,
          forecastData: parsed,
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
                  <label style={labelStyles}>Vùng (region)</label>
                  <input
                    type="text"
                    style={inputStyles}
                    value={forecastForm.region}
                    onChange={(e) => setForecastForm({ ...forecastForm, region: e.target.value })}
                  />
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Cây trồng (cropType)</label>
                  <input
                    type="text"
                    style={inputStyles}
                    value={forecastForm.cropType}
                    onChange={(e) => setForecastForm({ ...forecastForm, cropType: e.target.value })}
                  />
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>Loại dự báo</label>
                  <select
                    style={inputStyles}
                    value={forecastForm.type}
                    onChange={(e) =>
                      setForecastForm({
                        ...forecastForm,
                        type: e.target.value as 'price' | 'demand' | 'weather',
                      })
                    }
                  >
                    <option value="price">Giá (price)</option>
                    <option value="demand">Nhu cầu (demand)</option>
                    <option value="weather">Thời tiết (weather)</option>
                  </select>
                </div>

                <div style={fieldStyles}>
                  <label style={labelStyles}>forecastData (JSON)</label>
                  <textarea
                    style={{ ...textareaStyles, minHeight: '160px', fontFamily: 'monospace', fontSize: fontSize.small }}
                    value={forecastForm.forecastDataJson}
                    onChange={(e) => setForecastForm({ ...forecastForm, forecastDataJson: e.target.value })}
                  />
                </div>

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

            {forecasts.map((f) => (
              <div key={f.id} style={articleCardStyles}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm }}>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {f.region} · {f.cropType}
                  </Text.Title>
                  <button
                    type="button"
                    style={{ ...buttonStyles('outline'), padding: `${spacing.xs} ${spacing.sm}`, fontSize: fontSize.small }}
                    onClick={() => startEditForecast(f)}
                  >
                    Sửa
                  </button>
                </div>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  Loại: {f.type} · Từ {formatIsoDate(f.validFrom)} — {formatIsoDate(f.validTo)}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
};

export default TraderProfileNewsScreen;
