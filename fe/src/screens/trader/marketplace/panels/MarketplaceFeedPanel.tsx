/**
 * MarketplaceFeedPanel — "Mua / Bán" tab inside TraderMarketplaceScreen.
 * Migrated from TraderTradingOrdersScreen tabs: my-products, buying-requests.
 *
 * Requirements: FR-T03, FR-T04, US-T03
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { Icon } from '@/design-system/components/Icon';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Fab } from '@/components/trader/Fab';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  cropEmoji,
  standardLabel,
  toMarketplaceViMessage,
  CROP_LABELS,
  type ProductDto,
  type CreateProductDto,
} from '@/services/marketplaceService';
import {
  listBuyingRequests,
  buyerDisplayName,
  cropLabelBR,
  standardLabelBR,
  toBuyingRequestViMessage,
  type BuyingRequestDto,
} from '@/services/buyingRequestService';
import {
  createProposal,
  toProposalViMessage,
} from '@/services/proposalService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';

// ── Helpers ───────────────────────────────────────────────────────────────────

type FeedSubTab = 'my-products' | 'buying-requests';

const CROP_OPTIONS = Object.entries(CROP_LABELS).map(([value, label]) => ({ value, label }));

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: spacing.sm,
  border: `1px solid ${colors.background.tertiary}`,
  borderRadius: '6px',
  fontSize: fontSize.body,
  marginBottom: spacing.sm,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: fontSize.caption,
  fontWeight: fontWeight.medium,
  color: colors.text.secondary,
  marginBottom: '4px',
  display: 'block',
};

const cardStyles: React.CSSProperties = {
  padding: spacing.md,
  backgroundColor: colors.background.primary,
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  marginBottom: spacing.md,
};

const actionButtonStyles = (isPrimary: boolean): React.CSSProperties => ({
  flex: 1,
  padding: `${spacing.sm} ${spacing.md}`,
  backgroundColor: isPrimary ? colors.primary.zaloBlue : colors.background.secondary,
  color: isPrimary ? colors.text.inverse : colors.text.primary,
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: fontSize.caption,
  fontWeight: fontWeight.semibold,
  minHeight: '44px',
});

const dangerButtonStyles: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  backgroundColor: `${colors.functional.alertRed}10`,
  color: colors.functional.alertRed,
  border: `1px solid ${colors.functional.alertRed}30`,
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: fontSize.caption,
  fontWeight: fontWeight.semibold,
  minHeight: '44px',
};

// ── SkeletonCard ──────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div style={{ ...cardStyles }}>
    <div style={{ display: 'flex', gap: spacing.md }}>
      <div style={{ width: 80, height: 80, backgroundColor: colors.background.secondary, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        {[80, 60, 50].map((w, i) => (
          <div key={i} style={{ height: 12, width: `${w}%`, backgroundColor: colors.background.secondary, borderRadius: 6, marginBottom: spacing.xs }} />
        ))}
      </div>
    </div>
  </div>
);

// ── ProductForm ───────────────────────────────────────────────────────────────

interface ProductFormProps {
  initial?: Partial<CreateProductDto>;
  onSave: (data: CreateProductDto) => void;
  onCancel: () => void;
  saving: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, onSave, onCancel, saving }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [cropType, setCropType] = useState(initial?.cropType ?? 'durian');
  const [price, setPrice] = useState(initial?.price?.toString() ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? 'kg');
  const [stock, setStock] = useState(initial?.stockQuantity?.toString() ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: '16px 16px 0 0',
          padding: spacing.md,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text.Title size="small" style={{ margin: 0 }}>
            {initial?.name ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới'}
          </Text.Title>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing.xs, minWidth: 44, minHeight: 44 }} onClick={onCancel} aria-label="Đóng">
            <Icon name="close" size="md" color={colors.text.secondary} />
          </button>
        </div>

        <label style={labelStyle}>Tên sản phẩm *</label>
        <input style={inputStyle} placeholder="Ví dụ: Sầu riêng Monthong" value={name} onChange={(e) => setName(e.target.value)} />

        <label style={labelStyle}>Loại cây trồng *</label>
        <select style={{ ...inputStyle }} value={cropType} onChange={(e) => setCropType(e.target.value)}>
          {CROP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Giá (VNĐ) *</label>
            <input style={inputStyle} type="number" placeholder="VD: 120000" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Đơn vị</label>
            <input style={inputStyle} placeholder="kg" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>

        <label style={labelStyle}>Tồn kho (kg)</label>
        <input style={inputStyle} type="number" placeholder="VD: 500" value={stock} onChange={(e) => setStock(e.target.value)} />

        <label style={labelStyle}>Mô tả</label>
        <textarea style={{ ...inputStyle, height: '80px', resize: 'none' }} placeholder="Mô tả chất lượng, đặc điểm nổi bật..." value={description} onChange={(e) => setDescription(e.target.value)} />

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button style={{ flex: 1, padding: spacing.md, backgroundColor: colors.background.secondary, border: 'none', borderRadius: '8px', fontSize: fontSize.body, cursor: 'pointer', minHeight: 44 }} onClick={onCancel}>
            Hủy
          </button>
          <button
            style={{ flex: 2, padding: spacing.md, backgroundColor: saving ? colors.background.tertiary : colors.primary.zaloBlue, color: colors.text.inverse, border: 'none', borderRadius: '8px', fontSize: fontSize.body, fontWeight: fontWeight.semibold, cursor: saving ? 'not-allowed' : 'pointer', minHeight: 44 }}
            disabled={saving}
            onClick={() => {
              if (!name.trim() || !price) return;
              onSave({ name: name.trim(), cropType, unit: unit.trim() || 'kg', price: parseFloat(price), stockQuantity: stock ? parseInt(stock, 10) : undefined, description: description.trim() || undefined });
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

export const MarketplaceFeedPanel: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const [subTab, setSubTab] = useState<FeedSubTab>('my-products');

  // Products
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Buying requests
  const [buyingRequests, setBuyingRequests] = useState<BuyingRequestDto[]>([]);
  const [brLoading, setBrLoading] = useState(false);
  const [brError, setBrError] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Proposal
  const [proposingFor, setProposingFor] = useState<BuyingRequestDto | null>(null);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalNote, setProposalNote] = useState('');
  const [proposalSaving, setProposalSaving] = useState(false);

  const loadProducts = useCallback(() => {
    setProductsLoading(true);
    setProductsError(null);
    listProducts({ status: 'all' })
      .then((res) => {
        setProducts(res.items);
        setProductsLoading(false);
      })
      .catch((err: unknown) => {
        const msg = toMarketplaceViMessage(err, 'list');
        setProductsError(msg);
        setProductsLoading(false);
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      });
  }, [openSnackbar]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const loadBuyingRequests = useCallback(() => {
    setBrLoading(true);
    setBrError(null);
    listBuyingRequests({ status: 'open' })
      .then((res) => {
        setBuyingRequests(res.items);
        setBrLoading(false);
      })
      .catch((err: unknown) => {
        const msg = toBuyingRequestViMessage(err, 'list');
        setBrError(msg);
        setBrLoading(false);
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      });
  }, [openSnackbar]);

  useEffect(() => {
    if (subTab === 'buying-requests' && buyingRequests.length === 0 && !brLoading && !brError) {
      loadBuyingRequests();
    }
  }, [subTab, buyingRequests.length, brLoading, brError, loadBuyingRequests]);

  const handleSaveProduct = async (data: CreateProductDto) => {
    setFormSaving(true);
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, { name: data.name, price: data.price, stockQuantity: data.stockQuantity, description: data.description });
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        openSnackbar({ type: 'success', text: 'Cập nhật sản phẩm thành công!', duration: 3000, icon: true });
      } else {
        const created = await createProduct(data);
        setProducts((prev) => [created, ...prev]);
        openSnackbar({ type: 'success', text: 'Tạo sản phẩm thành công!', duration: 3000, icon: true });
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (err: unknown) {
      openSnackbar({ type: 'error', text: toMarketplaceViMessage(err, editingProduct ? 'update' : 'create'), duration: 4000, icon: true });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Ẩn sản phẩm này?')) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'inactive' as const } : p)));
      openSnackbar({ type: 'success', text: 'Đã ẩn sản phẩm.', duration: 3000, icon: true });
    } catch (err: unknown) {
      openSnackbar({ type: 'error', text: toMarketplaceViMessage(err, 'delete'), duration: 4000, icon: true });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendProposal = async () => {
    if (!proposingFor || !proposalPrice) return;
    setProposalSaving(true);
    try {
      await createProposal({
        buyingRequestId: proposingFor.id,
        price: parseFloat(proposalPrice),
        quantity: proposingFor.quantity,
        standardCode: proposingFor.qualityStandardCode,
        note: proposalNote.trim() || undefined,
      });
      openSnackbar({ type: 'success', text: 'Đã gửi đề xuất tới người mua!', duration: 3000, icon: true });
      setProposingFor(null);
      setProposalPrice('');
      setProposalNote('');
    } catch (err) {
      openSnackbar({ type: 'error', text: toProposalViMessage(err, 'create'), duration: 4000, icon: true });
    } finally {
      setProposalSaving(false);
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

  // ── My-products render ──────────────────────────────────────────────────────

  const renderMyProducts = () => {
    if (productsLoading) return <div>{[1, 2, 3].map((k) => <SkeletonCard key={k} />)}</div>;
    if (productsError) return <EmptyState icon="⚠️" title="Không tải được sản phẩm" description={productsError} cta={{ label: 'Thử lại', onClick: loadProducts }} />;

    const activeCount = products.filter((p) => p.status === 'active').length;
    const inactiveCount = products.filter((p) => p.status === 'inactive').length;

    return (
      <div>
        <Text.Title size="small" style={{ marginBottom: spacing.md }}>
          Tin bán của tôi ({activeCount} đang bán{inactiveCount > 0 ? `, ${inactiveCount} đã ẩn` : ''})
        </Text.Title>

        {products.length === 0 ? (
          <EmptyState icon="📦" title="Chưa có sản phẩm nào" description="Nhấn + để tạo sản phẩm mới và bắt đầu đăng bán!" />
        ) : (
          products.map((product) => {
            const isDeleting = deletingId === product.id;
            const emoji = product.images[0] ?? cropEmoji(product.cropType);
            const std = standardLabel(product.standardCode);

            return (
              <div key={product.id} style={{ ...cardStyles, opacity: product.status === 'inactive' ? 0.65 : 1 }}>
                <div style={{ display: 'flex', gap: spacing.md }}>
                  <div style={{ width: 80, height: 80, backgroundColor: colors.background.secondary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Text.Title size="small" style={{ margin: 0 }}>{product.name}</Text.Title>
                        {std && <Text size="xSmall" style={{ color: colors.primary.agriGreen, margin: 0 }}>{std}</Text>}
                      </div>
                      <div style={{ padding: `${spacing.xs} ${spacing.sm}`, backgroundColor: product.status === 'active' ? `${colors.primary.agriGreen}15` : `${colors.text.secondary}15`, borderRadius: 6 }}>
                        <Text size="xSmall" style={{ color: product.status === 'active' ? colors.primary.agriGreen : colors.text.secondary, fontWeight: fontWeight.semibold }}>
                          {product.status === 'active' ? 'Đang bán' : 'Đã ẩn'}
                        </Text>
                      </div>
                    </div>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, marginTop: spacing.sm }}>
                      {product.price.toLocaleString('vi-VN')} VNĐ/{product.unit}
                    </Text>
                    {product.stockQuantity !== undefined && (
                      <Text size="xSmall" style={{ color: colors.text.secondary }}>
                        Tồn kho: {product.stockQuantity} {product.unit}
                      </Text>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
                  <button style={dangerButtonStyles} disabled={isDeleting || product.status === 'inactive'} onClick={() => void handleDeleteProduct(product.id)}>
                    {isDeleting ? '...' : 'Ẩn'}
                  </button>
                  <button style={actionButtonStyles(false)} onClick={() => { setEditingProduct(product); setShowForm(true); }}>
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ── Buying-requests render ──────────────────────────────────────────────────

  const renderBuyingRequests = () => {
    if (brLoading) return <div>{[1, 2, 3].map((k) => <SkeletonCard key={k} />)}</div>;
    if (brError) return <EmptyState icon="⚠️" title="Không tải được nhu cầu mua" description={brError} cta={{ label: 'Thử lại', onClick: loadBuyingRequests }} />;
    if (buyingRequests.length === 0) return <EmptyState icon="🛒" title="Chưa có nhu cầu mua nào" description="Người mua chưa đăng yêu cầu nào đang mở" />;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text.Title size="small">Nhu cầu thu mua ({buyingRequests.length})</Text.Title>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.primary.zaloBlue, fontSize: fontSize.caption, fontWeight: fontWeight.medium, padding: 0, minHeight: 44 }} onClick={loadBuyingRequests}>
            Làm mới
          </button>
        </div>

        {buyingRequests.map((req) => {
          const cropName = cropLabelBR(req.cropType);
          const stdName = standardLabelBR(req.qualityStandardCode);
          const buyerName = buyerDisplayName(req.buyerId);
          const deliveryDate = new Date(req.deliveryDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const ageDays = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 86400000);
          const ageLabel = ageDays === 0 ? 'Hôm nay' : ageDays === 1 ? '1 ngày trước' : `${ageDays} ngày trước`;

          return (
            <div key={req.id} style={cardStyles}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                <div>
                  <Text.Title size="small" style={{ margin: 0 }}>{buyerName}</Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>{ageLabel}</Text>
                </div>
                <div style={{ padding: `${spacing.xs} ${spacing.sm}`, backgroundColor: `${colors.primary.agriGreen}15`, borderRadius: 6 }}>
                  <Text size="xSmall" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.semibold }}>{cropName}</Text>
                </div>
              </div>

              <div style={{ padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: 6, marginBottom: spacing.sm, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${spacing.xs} ${spacing.md}` }}>
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Số lượng</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.medium }}>{req.quantity} {req.unit}</Text>
                </div>
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Giá kỳ vọng</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.medium }}>
                    {req.expectedPrice ? `${req.expectedPrice.toLocaleString('vi-VN')} VNĐ/${req.unit}` : 'Thương lượng'}
                  </Text>
                </div>
                {stdName && (
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Tiêu chuẩn</Text>
                    <Text size="small" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.medium }}>{stdName}</Text>
                  </div>
                )}
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Ngày giao</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.medium }}>{deliveryDate}</Text>
                </div>
              </div>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button style={actionButtonStyles(false)}>Xem chi tiết</button>
                <button style={actionButtonStyles(true)} onClick={() => { setProposingFor(req); setProposalPrice(req.expectedPrice?.toString() ?? ''); }}>
                  Gửi đề xuất
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: spacing.md, paddingBottom: 120 }}>
      <div style={tabBarStyle}>
        <button style={subTabBtn(subTab === 'my-products')} onClick={() => setSubTab('my-products')}>
          Tin bán của tôi
        </button>
        <button style={subTabBtn(subTab === 'buying-requests')} onClick={() => setSubTab('buying-requests')}>
          Nhu cầu thu mua
        </button>
      </div>

      {subTab === 'my-products' && renderMyProducts()}
      {subTab === 'buying-requests' && renderBuyingRequests()}

      {/* FAB — only on my-products sub-tab */}
      {subTab === 'my-products' && (
        <Fab onClick={() => { setEditingProduct(null); setShowForm(true); }} />
      )}

      {/* Product form modal */}
      {showForm && (
        <ProductForm
          initial={editingProduct ? { name: editingProduct.name, cropType: editingProduct.cropType, price: editingProduct.price, unit: editingProduct.unit, stockQuantity: editingProduct.stockQuantity, description: editingProduct.description } : undefined}
          onSave={(data) => void handleSaveProduct(data)}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
          saving={formSaving}
        />
      )}

      {/* Proposal form modal */}
      {proposingFor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setProposingFor(null)}>
          <div style={{ backgroundColor: colors.background.primary, borderRadius: '16px 16px 0 0', padding: spacing.md, maxHeight: '70vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text.Title size="small" style={{ margin: 0 }}>Gửi đề xuất giá</Text.Title>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44 }} onClick={() => setProposingFor(null)} aria-label="Đóng">
                <Icon name="close" size="md" color={colors.text.secondary} />
              </button>
            </div>

            <div style={{ padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: 8, marginBottom: spacing.md }}>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>Nhu cầu của người mua</Text>
              <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                {cropLabelBR(proposingFor.cropType)} — {proposingFor.quantity} {proposingFor.unit}
              </Text>
              {proposingFor.expectedPrice && (
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  Giá kỳ vọng: {proposingFor.expectedPrice.toLocaleString('vi-VN')} ₫/{proposingFor.unit}
                </Text>
              )}
            </div>

            <label style={labelStyle}>Giá đề xuất (₫/{proposingFor.unit}) *</label>
            <input style={inputStyle} type="number" placeholder={`VD: ${proposingFor.expectedPrice ?? 50000}`} value={proposalPrice} onChange={(e) => setProposalPrice(e.target.value)} />

            <label style={labelStyle}>Ghi chú (tùy chọn)</label>
            <textarea style={{ ...inputStyle, height: '72px', resize: 'none' }} placeholder="Thêm thông tin về chất lượng, nguồn gốc, thời gian giao hàng..." value={proposalNote} onChange={(e) => setProposalNote(e.target.value)} />

            <div style={{ display: 'flex', gap: spacing.sm }}>
              <button style={{ flex: 1, padding: spacing.md, backgroundColor: colors.background.secondary, border: 'none', borderRadius: 8, fontSize: fontSize.body, cursor: 'pointer', minHeight: 44 }} onClick={() => setProposingFor(null)}>
                Hủy
              </button>
              <button
                style={{ flex: 2, padding: spacing.md, backgroundColor: proposalSaving ? colors.background.tertiary : colors.primary.zaloBlue, color: colors.text.inverse, border: 'none', borderRadius: 8, fontSize: fontSize.body, fontWeight: fontWeight.semibold, cursor: proposalSaving || !proposalPrice ? 'not-allowed' : 'pointer', opacity: !proposalPrice ? 0.6 : 1, minHeight: 44 }}
                disabled={proposalSaving || !proposalPrice}
                onClick={() => void handleSendProposal()}
              >
                {proposalSaving ? 'Đang gửi...' : 'Gửi đề xuất'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceFeedPanel;
