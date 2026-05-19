/**
 * NewsFeedScreen — đọc tin tức (news_article) và dự báo giá (forecast) từ trader.
 * Read-only: farmer & buyer xem; trader có panel riêng để soạn ở Marketplace.
 *
 * Requirements: FR-F12 (tin tức), FR-T12 (dự báo giá).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Page, Text, Spinner, useNavigate } from 'zmp-ui';
import { Icon } from '@/design-system/components/Icon';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listNews,
  listForecasts,
  toNewsForecastViMessage,
  type NewsArticleDto,
  type ForecastDto,
} from '@/services/newsForecastService';
import { CROP_LABELS } from '@/services/marketplaceService';

type Tab = 'news' | 'forecasts';

const CATEGORY_LABELS: Record<string, string> = {
  price_forecast: 'Dự báo giá',
  weather_alert: 'Cảnh báo thời tiết',
  farming_technique: 'Kỹ thuật canh tác',
};

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function forecastTypeLabel(t: ForecastDto['type']): string {
  switch (t) {
    case 'price': return 'Dự báo giá';
    case 'demand': return 'Dự báo nhu cầu';
    case 'weather': return 'Dự báo thời tiết';
    default: return 'Dự báo';
  }
}

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.background.primary,
  borderRadius: 12,
  padding: spacing.md,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  marginBottom: spacing.md,
};

export interface NewsFeedScreenProps {
  /** Hiển thị title khác nhau theo context — vd "Tin tức thị trường" hoặc "Tin & dự báo". */
  title?: string;
  /** Hide header back button (vd: dùng trong tab có sẵn). */
  hideBack?: boolean;
}

export const NewsFeedScreen: React.FC<NewsFeedScreenProps> = ({
  title = 'Tin tức & Dự báo giá',
  hideBack,
}) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const [tab, setTab] = useState<Tab>('news');

  const [news, setNews] = useState<NewsArticleDto[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsArticleDto | null>(null);

  const [forecasts, setForecasts] = useState<ForecastDto[]>([]);
  const [forecastsLoading, setForecastsLoading] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<ForecastDto | null>(null);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await listNews({ page: 1, limit: 50 });
      setNews(res.items);
    } catch (err) {
      openSnackbar({ type: 'error', text: toNewsForecastViMessage(err, 'newsList'), duration: 4000, icon: true });
    } finally {
      setNewsLoading(false);
    }
  }, [openSnackbar]);

  const loadForecasts = useCallback(async () => {
    setForecastsLoading(true);
    try {
      const res = await listForecasts({ page: 1, limit: 50 });
      setForecasts(res.items);
    } catch (err) {
      openSnackbar({ type: 'error', text: toNewsForecastViMessage(err, 'forecastList'), duration: 4000, icon: true });
    } finally {
      setForecastsLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    if (tab === 'news' && news.length === 0) void loadNews();
    if (tab === 'forecasts' && forecasts.length === 0) void loadForecasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: active ? colors.background.primary : 'transparent',
    color: active ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: fontSize.small,
    fontWeight: active ? fontWeight.semibold : fontWeight.regular,
    minHeight: 44,
    transition: 'all 0.15s',
  });

  return (
    <Page className="news-feed-screen">
      {!hideBack && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            backgroundColor: colors.background.primary,
            borderBottom: `1px solid ${colors.background.tertiary}`,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              backgroundColor: colors.background.secondary,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '18px' }}>‹</span>
          </button>
          <Text.Title size="small" style={{ margin: 0 }}>{title}</Text.Title>
        </div>
      )}

      <div style={{ padding: spacing.md, paddingBottom: 100 }}>
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            backgroundColor: colors.background.secondary,
            padding: spacing.xs,
            borderRadius: 8,
            marginBottom: spacing.md,
            gap: spacing.xs,
          }}
        >
          <button type="button" style={tabBtn(tab === 'news')} onClick={() => setTab('news')}>
            📰 Tin tức
          </button>
          <button type="button" style={tabBtn(tab === 'forecasts')} onClick={() => setTab('forecasts')}>
            📊 Dự báo giá
          </button>
        </div>

        {/* News tab */}
        {tab === 'news' && (
          <>
            {newsLoading && news.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xxl }}>
                <Spinner />
              </div>
            )}
            {!newsLoading && news.length === 0 && (
              <EmptyState
                icon="📰"
                title="Chưa có tin tức"
                description="Hiện chưa có bài viết nào từ thương lái. Vui lòng quay lại sau."
              />
            )}
            {news.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedNews(a)}
                style={{
                  ...cardStyle,
                  width: '100%',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: `${colors.primary.zaloBlue}14`,
                      color: colors.primary.zaloBlue,
                      borderRadius: 6,
                      fontSize: fontSize.small,
                      fontWeight: fontWeight.medium,
                    }}
                  >
                    {categoryLabel(a.category)}
                  </span>
                  <span style={{ fontSize: fontSize.small, color: colors.text.secondary }}>
                    {formatDate(a.publishedAt)}
                  </span>
                </div>
                <div style={{ fontSize: 28, marginBottom: spacing.xs }}>{a.imageUrl ?? '📰'}</div>
                <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.xs }}>{a.title}</Text.Title>
                <Text
                  size="small"
                  style={{
                    color: colors.text.secondary,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {a.summary}
                </Text>
              </button>
            ))}
          </>
        )}

        {/* Forecast tab */}
        {tab === 'forecasts' && (
          <>
            {forecastsLoading && forecasts.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xxl }}>
                <Spinner />
              </div>
            )}
            {!forecastsLoading && forecasts.length === 0 && (
              <EmptyState
                icon="📊"
                title="Chưa có dự báo giá"
                description="Hiện chưa có dự báo nào từ thương lái. Vui lòng quay lại sau."
              />
            )}
            {forecasts.map((f) => {
              const fd = f.forecastData as Record<string, unknown> | null;
              const cropName = CROP_LABELS[f.cropType] ?? f.cropType;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedForecast(f)}
                  style={{
                    ...cardStyle,
                    width: '100%',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    <Text.Title size="small" style={{ margin: 0 }}>
                      {cropName}{f.region ? ` · ${f.region}` : ''}
                    </Text.Title>
                    <span
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: `${colors.primary.agriGreen}15`,
                        color: colors.primary.agriGreen,
                        borderRadius: 6,
                        fontSize: fontSize.small,
                        fontWeight: fontWeight.medium,
                      }}
                    >
                      {forecastTypeLabel(f.type)}
                    </span>
                  </div>
                  {fd && (typeof fd.priceMin === 'number' || typeof fd.priceMax === 'number') && (
                    <div
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.background.secondary,
                        borderRadius: 6,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                        💰 {fd.priceMin != null ? Number(fd.priceMin).toLocaleString('vi-VN') : '?'} – {fd.priceMax != null ? Number(fd.priceMax).toLocaleString('vi-VN') : '?'} ₫/kg
                      </Text>
                    </div>
                  )}
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    <Icon name="calendar" size="sm" color={colors.text.secondary} />{' '}
                    {formatDate(f.validFrom)} → {formatDate(f.validTo)}
                  </Text>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* News detail modal */}
      {selectedNews && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            zIndex: 1500,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedNews(null)}
        >
          <div
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: '16px 16px 0 0',
              padding: spacing.md,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text.Title size="small" style={{ margin: 0 }}>Chi tiết bài viết</Text.Title>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                aria-label="Đóng"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: colors.background.secondary,
                  border: 'none', cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <span
              style={{
                display: 'inline-block',
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: `${colors.primary.zaloBlue}14`,
                color: colors.primary.zaloBlue,
                borderRadius: 6,
                fontSize: fontSize.small,
                fontWeight: fontWeight.medium,
                marginBottom: spacing.sm,
              }}
            >
              {categoryLabel(selectedNews.category)}
            </span>
            <Text.Title size="normal" style={{ margin: 0, marginBottom: spacing.xs }}>{selectedNews.title}</Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0, marginBottom: spacing.md }}>
              📅 {formatDate(selectedNews.publishedAt)}
            </Text>
            {selectedNews.imageUrl && selectedNews.imageUrl.startsWith('http') && (
              <img
                src={selectedNews.imageUrl}
                alt={selectedNews.title}
                style={{ width: '100%', borderRadius: 8, marginBottom: spacing.md }}
              />
            )}
            <Text size="small" style={{ color: colors.text.primary, marginBottom: spacing.sm, fontStyle: 'italic' }}>
              {selectedNews.summary}
            </Text>
            <Text size="small" style={{ whiteSpace: 'pre-wrap', color: colors.text.primary }}>
              {selectedNews.content}
            </Text>
          </div>
        </div>
      )}

      {/* Forecast detail modal */}
      {selectedForecast && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            zIndex: 1500,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedForecast(null)}
        >
          <div
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: '16px 16px 0 0',
              padding: spacing.md,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text.Title size="small" style={{ margin: 0 }}>Chi tiết dự báo</Text.Title>
              <button
                type="button"
                onClick={() => setSelectedForecast(null)}
                aria-label="Đóng"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: colors.background.secondary,
                  border: 'none', cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <Text.Title size="normal" style={{ margin: 0, marginBottom: spacing.xs }}>
              {CROP_LABELS[selectedForecast.cropType] ?? selectedForecast.cropType}
              {selectedForecast.region ? ` · ${selectedForecast.region}` : ''}
            </Text.Title>
            <span
              style={{
                display: 'inline-block',
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: `${colors.primary.agriGreen}15`,
                color: colors.primary.agriGreen,
                borderRadius: 6,
                fontSize: fontSize.small,
                fontWeight: fontWeight.medium,
                marginBottom: spacing.md,
              }}
            >
              {forecastTypeLabel(selectedForecast.type)}
            </span>

            <div style={{ marginBottom: spacing.md }}>
              <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.xs }}>Thời gian hiệu lực</Text>
              <Text size="small" style={{ margin: 0 }}>
                {formatDate(selectedForecast.validFrom)} → {formatDate(selectedForecast.validTo)}
              </Text>
            </div>

            {(() => {
              const fd = selectedForecast.forecastData as Record<string, unknown> | null;
              if (!fd) return null;
              const entries = Object.entries(fd);
              return (
                <div style={{ padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: 8 }}>
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
                    Nội dung dự báo
                  </Text>
                  {entries.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: `${spacing.xs} 0`, borderBottom: `1px solid ${colors.background.tertiary}` }}>
                      <Text size="small" style={{ margin: 0, color: colors.text.secondary }}>{k}</Text>
                      <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                        {typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v)}
                      </Text>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </Page>
  );
};

export default NewsFeedScreen;
