/**
 * MarketplaceNewsPanel — "Bản tin & Giá" tab inside TraderMarketplaceScreen.
 * Migrated from TraderProfileNewsScreen tabs: news, forecasts.
 *
 * Requirements: FR-T12, US-T05
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text, Spinner } from 'zmp-ui';
import { Icon } from '@/design-system/components/Icon';
import { Fab } from '@/components/trader/Fab';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import {
  listNews,
  listForecasts,
  createNews,
  updateNews,
  createForecast,
  updateForecast,
  toNewsForecastViMessage,
  type NewsArticleDto,
  type ForecastDto,
} from '@/services/newsForecastService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';

// ── Constants ─────────────────────────────────────────────────────────────────

type NewsSubTab = 'news' | 'forecasts';

const CATEGORY_OPTIONS = [
  { value: 'price_forecast', label: 'Dự báo giá' },
  { value: 'weather_alert', label: 'Cảnh báo thời tiết' },
  { value: 'farming_technique', label: 'Kỹ thuật canh tác' },
];

function categoryLabel(cat: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat;
}

function categoryBadgeStyle(category: string): React.CSSProperties {
  const bg =
    category === 'price_forecast' ? `${colors.primary.zaloBlue}15`
    : category === 'weather_alert' ? `${colors.functional.warningYellow}35`
    : `${colors.primary.agriGreen}15`;
  const color =
    category === 'price_forecast' ? colors.primary.zaloBlue
    : category === 'weather_alert' ? colors.text.primary
    : colors.primary.agriGreen;
  return { display: 'inline-block', padding: `${spacing.xs} ${spacing.sm}`, backgroundColor: bg, color, borderRadius: 6, fontSize: fontSize.small, fontWeight: fontWeight.medium };
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return iso; }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: spacing.sm,
  border: `1px solid ${colors.background.tertiary}`,
  borderRadius: '6px',
  fontSize: fontSize.body,
  backgroundColor: colors.background.primary,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: fontSize.caption,
  color: colors.text.secondary,
  marginBottom: '4px',
  display: 'block',
};

const fieldStyle: React.CSSProperties = { marginBottom: spacing.md };

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.background.primary,
  borderRadius: 12,
  padding: spacing.md,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  marginBottom: spacing.md,
};

const outlineBtn: React.CSSProperties = {
  padding: `${spacing.xs} ${spacing.sm}`,
  backgroundColor: 'transparent',
  color: colors.text.primary,
  border: `1px solid ${colors.background.tertiary}`,
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: fontSize.small,
  fontWeight: fontWeight.medium,
  minHeight: 44,
};

const primaryBtn: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.lg}`,
  backgroundColor: colors.primary.zaloBlue,
  color: colors.text.inverse,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: fontSize.body,
  fontWeight: fontWeight.medium,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  minHeight: 44,
};

// ── Main Panel ────────────────────────────────────────────────────────────────

export const MarketplaceNewsPanel: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const [subTab, setSubTab] = useState<NewsSubTab>('news');

  // News
  const [articles, setArticles] = useState<NewsArticleDto[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({ title: '', summary: '', content: '', category: 'price_forecast', imageUrl: '' });

  // Forecasts
  const [forecasts, setForecasts] = useState<ForecastDto[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [showForecastForm, setShowForecastForm] = useState(false);
  const [editingForecastId, setEditingForecastId] = useState<string | null>(null);
  const [forecastForm, setForecastForm] = useState({
    cropType: '',
    predictedPriceMin: '',
    predictedPriceMax: '',
    forecastDate: '',
    region: '',
  });

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await listNews({ page: 1, limit: 50 });
      setArticles(res.items);
    } catch (e: unknown) {
      openSnackbar({ type: 'error', text: toNewsForecastViMessage(e, 'newsList'), duration: 4000, icon: true });
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
      openSnackbar({ type: 'error', text: toNewsForecastViMessage(e, 'forecastList'), duration: 4000, icon: true });
    } finally {
      setForecastLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    if (subTab === 'news') void loadNews();
  }, [subTab, loadNews]);

  useEffect(() => {
    if (subTab === 'forecasts') void loadForecasts();
  }, [subTab, loadForecasts]);

  const resetNewsForm = () => {
    setNewsForm({ title: '', summary: '', content: '', category: 'price_forecast', imageUrl: '' });
    setEditingArticleId(null);
    setShowNewsForm(false);
  };

  const startEditArticle = (a: NewsArticleDto) => {
    setEditingArticleId(a.id);
    setNewsForm({ title: a.title, summary: a.summary, content: a.content, category: a.category, imageUrl: a.imageUrl ?? '' });
    setShowNewsForm(true);
  };

  const handlePublishArticle = async () => {
    if (!newsForm.title.trim() || !newsForm.summary.trim() || !newsForm.content.trim()) {
      openSnackbar({ type: 'error', text: 'Vui lòng nhập đủ tiêu đề, tóm tắt và nội dung', duration: 3000 });
      return;
    }
    try {
      if (editingArticleId) {
        await updateNews(editingArticleId, { title: newsForm.title, summary: newsForm.summary, content: newsForm.content, category: newsForm.category, imageUrl: newsForm.imageUrl || undefined });
        openSnackbar({ type: 'success', text: 'Đã cập nhật bài viết', duration: 2500 });
      } else {
        await createNews({ title: newsForm.title, summary: newsForm.summary, content: newsForm.content, category: newsForm.category, imageUrl: newsForm.imageUrl || undefined });
        openSnackbar({ type: 'success', text: 'Đã đăng bài', duration: 2500 });
      }
      resetNewsForm();
      await loadNews();
    } catch (e: unknown) {
      openSnackbar({ type: 'error', text: toNewsForecastViMessage(e, editingArticleId ? 'newsUpdate' : 'newsCreate'), duration: 4000, icon: true });
    }
  };

  const resetForecastForm = () => {
    setForecastForm({ cropType: '', predictedPriceMin: '', predictedPriceMax: '', forecastDate: '', region: '' });
    setEditingForecastId(null);
    setShowForecastForm(false);
  };

  const startEditForecast = (f: ForecastDto) => {
    setEditingForecastId(f.id);
    const fd = f.forecastData as Record<string, unknown> | null;
    setForecastForm({
      cropType: f.cropType,
      region: f.region,
      predictedPriceMin: fd && typeof fd.priceMin === 'number' ? String(fd.priceMin) : '',
      predictedPriceMax: fd && typeof fd.priceMax === 'number' ? String(fd.priceMax) : '',
      forecastDate: f.validFrom.slice(0, 10),
    });
    setShowForecastForm(true);
  };

  const handleSaveForecast = async () => {
    if (!forecastForm.cropType.trim() || !forecastForm.forecastDate) {
      openSnackbar({ type: 'error', text: 'Vui lòng nhập loại cây trồng và ngày dự báo', duration: 3000 });
      return;
    }
    const forecastData = {
      priceMin: forecastForm.predictedPriceMin ? parseFloat(forecastForm.predictedPriceMin) : undefined,
      priceMax: forecastForm.predictedPriceMax ? parseFloat(forecastForm.predictedPriceMax) : undefined,
    };
    const validFrom = new Date(forecastForm.forecastDate).toISOString();
    const validTo = new Date(new Date(forecastForm.forecastDate).getTime() + 7 * 86400000).toISOString();
    try {
      if (editingForecastId) {
        await updateForecast(editingForecastId, { region: forecastForm.region, cropType: forecastForm.cropType, type: 'price', forecastData, validFrom, validTo });
        openSnackbar({ type: 'success', text: 'Đã cập nhật dự báo', duration: 2500 });
      } else {
        await createForecast({ region: forecastForm.region, cropType: forecastForm.cropType, type: 'price', forecastData, validFrom, validTo });
        openSnackbar({ type: 'success', text: 'Đã tạo dự báo', duration: 2500 });
      }
      resetForecastForm();
      await loadForecasts();
    } catch (e: unknown) {
      openSnackbar({ type: 'error', text: toNewsForecastViMessage(e, editingForecastId ? 'forecastUpdate' : 'forecastCreate'), duration: 4000, icon: true });
    }
  };

  // ── Sub-tab toggle ──────────────────────────────────────────────────────────

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.secondary,
    padding: spacing.xs,
    borderRadius: '8px',
    marginBottom: spacing.md,
    gap: spacing.xs,
  };

  const subTabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: active ? colors.background.primary : 'transparent',
    color: active ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.small,
    fontWeight: active ? fontWeight.semibold : fontWeight.regular,
    minHeight: '44px',
    transition: 'all 0.15s',
  });

  // ── News tab ────────────────────────────────────────────────────────────────

  const renderNewsTab = () => (
    <div>
      {newsLoading && articles.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xxl }}><Spinner /></div>
      )}

      {/* News form */}
      {showNewsForm && (
        <div style={cardStyle}>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            {editingArticleId ? 'Sửa bài viết' : 'Viết bài mới'}
          </Text.Title>

          <div style={fieldStyle}>
            <label style={labelStyle}>Danh mục</label>
            <select style={inputStyle} value={newsForm.category} onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Tiêu đề</label>
            <input type="text" style={inputStyle} placeholder="Nhập tiêu đề bài viết..." value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Tóm tắt</label>
            <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Mô tả ngắn..." value={newsForm.summary} onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Nội dung</label>
            <textarea style={{ ...inputStyle, minHeight: '160px', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Nhập nội dung bài viết..." value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Ảnh đại diện (URL hoặc emoji)</label>
            <input type="text" style={inputStyle} placeholder="https://... hoặc 📊" value={newsForm.imageUrl} onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: spacing.md }}>
            <button type="button" style={primaryBtn} onClick={() => void handlePublishArticle()}>
              <Icon name="check" size="sm" color={colors.text.inverse} />
              {editingArticleId ? 'Cập nhật' : 'Đăng bài'}
            </button>
            <button type="button" style={outlineBtn} onClick={resetNewsForm}>Hủy</button>
          </div>
        </div>
      )}

      {!articles.length && !newsLoading && !showNewsForm && (
        <EmptyState icon="📰" title="Chưa có bài viết nào" description="Nhấn nút Soạn để đăng bài đầu tiên" />
      )}

      {articles.map((article) => (
        <div key={article.id} style={cardStyle}>
          <div style={{ marginBottom: spacing.sm, display: 'flex', justifyContent: 'space-between', gap: spacing.sm }}>
            <span style={categoryBadgeStyle(article.category)}>{categoryLabel(article.category)}</span>
            <button type="button" style={outlineBtn} onClick={() => startEditArticle(article)}>Sửa</button>
          </div>
          <div style={{ fontSize: 28, marginBottom: spacing.xs }}>{article.imageUrl ?? '📰'}</div>
          <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.xs }}>{article.title}</Text.Title>
          <Text size="small" style={{ color: colors.text.secondary, margin: 0, marginBottom: spacing.sm, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {article.summary}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.text.secondary, fontSize: fontSize.small }}>
            <Icon name="calendar" size="sm" color={colors.text.secondary} />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Forecasts tab ───────────────────────────────────────────────────────────

  const renderForecastsTab = () => (
    <div>
      {forecastLoading && forecasts.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xxl }}><Spinner /></div>
      )}

      {/* Forecast form */}
      {showForecastForm && (
        <div style={cardStyle}>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            {editingForecastId ? 'Sửa dự báo' : 'Dự báo mới'}
          </Text.Title>

          <div style={fieldStyle}>
            <label style={labelStyle}>Loại cây trồng *</label>
            <input type="text" style={inputStyle} placeholder="VD: pomelo" value={forecastForm.cropType} onChange={(e) => setForecastForm({ ...forecastForm, cropType: e.target.value })} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Vùng</label>
            <input type="text" style={inputStyle} placeholder="VD: Tiền Giang" value={forecastForm.region} onChange={(e) => setForecastForm({ ...forecastForm, region: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Giá min (₫/kg)</label>
              <input type="number" style={inputStyle} placeholder="VD: 30000" value={forecastForm.predictedPriceMin} onChange={(e) => setForecastForm({ ...forecastForm, predictedPriceMin: e.target.value })} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Giá max (₫/kg)</label>
              <input type="number" style={inputStyle} placeholder="VD: 45000" value={forecastForm.predictedPriceMax} onChange={(e) => setForecastForm({ ...forecastForm, predictedPriceMax: e.target.value })} />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Ngày dự báo *</label>
            <input type="date" style={inputStyle} value={forecastForm.forecastDate} onChange={(e) => setForecastForm({ ...forecastForm, forecastDate: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: spacing.md }}>
            <button type="button" style={primaryBtn} onClick={() => void handleSaveForecast()}>
              <Icon name="check" size="sm" color={colors.text.inverse} />
              {editingForecastId ? 'Cập nhật' : 'Lưu'}
            </button>
            <button type="button" style={outlineBtn} onClick={resetForecastForm}>Hủy</button>
          </div>
        </div>
      )}

      {!forecasts.length && !forecastLoading && !showForecastForm && (
        <EmptyState icon="📊" title="Chưa có dự báo nào" description="Nhấn nút Soạn để tạo dự báo đầu tiên" />
      )}

      {forecasts.map((f) => {
        const typeViLabel = f.type === 'price' ? 'Dự báo giá' : f.type === 'demand' ? 'Dự báo nhu cầu' : 'Dự báo thời tiết';
        const typeBg = f.type === 'price' ? `${colors.primary.zaloBlue}15` : f.type === 'demand' ? `${colors.primary.agriGreen}15` : `${colors.functional.warningYellow}35`;
        const typeColor = f.type === 'price' ? colors.primary.zaloBlue : f.type === 'demand' ? colors.primary.agriGreen : colors.text.primary;
        const fd = f.forecastData as Record<string, unknown> | null;

        return (
          <div key={f.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm }}>
              <div>
                <Text.Title size="small" style={{ margin: 0, marginBottom: 4 }}>{f.cropType} · {f.region}</Text.Title>
                <span style={{ display: 'inline-block', padding: `2px ${spacing.sm}`, backgroundColor: typeBg, color: typeColor, borderRadius: 4, fontSize: fontSize.small, fontWeight: fontWeight.medium }}>{typeViLabel}</span>
              </div>
              <button type="button" style={{ ...outlineBtn, flexShrink: 0 }} onClick={() => startEditForecast(f)}>Sửa</button>
            </div>

            {fd && (typeof fd.priceMin === 'number' || typeof fd.priceMax === 'number') && (
              <div style={{ padding: `${spacing.xs} ${spacing.sm}`, backgroundColor: colors.background.secondary, borderRadius: 6, marginBottom: spacing.sm }}>
                <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                  Giá dự báo: {fd.priceMin != null ? `${(fd.priceMin as number).toLocaleString('vi-VN')}` : '?'} — {fd.priceMax != null ? `${(fd.priceMax as number).toLocaleString('vi-VN')}` : '?'} ₫/kg
                </Text>
              </div>
            )}

            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {formatDate(f.validFrom)} — {formatDate(f.validTo)}
            </Text>
          </div>
        );
      })}
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  const handleFabClick = () => {
    if (subTab === 'news') {
      resetNewsForm();
      setShowNewsForm(true);
    } else {
      resetForecastForm();
      setShowForecastForm(true);
    }
  };

  return (
    <div style={{ padding: spacing.md, paddingBottom: 120 }}>
      <div style={tabBarStyle}>
        <button style={subTabBtn(subTab === 'news')} onClick={() => setSubTab('news')}>
          Tin tức
        </button>
        <button style={subTabBtn(subTab === 'forecasts')} onClick={() => setSubTab('forecasts')}>
          Dự báo
        </button>
      </div>

      {subTab === 'news' && renderNewsTab()}
      {subTab === 'forecasts' && renderForecastsTab()}

      <Fab onClick={handleFabClick} label="Soạn" />
    </div>
  );
};

export default MarketplaceNewsPanel;
