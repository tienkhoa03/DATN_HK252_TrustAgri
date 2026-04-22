/**
 * Trader Trading & Orders Screen — Phase 11.1 update
 * Sàn giao dịch và Đơn hàng - Thực hiện nghiệp vụ thương mại với Người mua
 *
 * Requirements: FR-T03, FR-T04, FR-T05, FR-T06, US-T03
 *
 * Features:
 * - Tab Kho hàng (My Products): Quản lý tin đăng bán, Tạo / sửa / xóa sản phẩm
 * - Tab Nhu cầu công khai (Buying Requests): Yêu cầu từ người mua + Gửi đề xuất
 * - Tab Quản lý Đơn hàng (Orders): orderService (Axios), Accept/Reject
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Page, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  standardLabel,
  cropEmoji,
  toMarketplaceViMessage,
  CROP_LABELS,
  type ProductDto,
  type CreateProductDto,
} from '../../../services/marketplaceService';
import {
  listBuyingRequests,
  buyerDisplayName,
  cropLabelBR,
  standardLabelBR,
  toBuyingRequestViMessage,
  type BuyingRequestDto,
} from '../../../services/buyingRequestService';
import {
  listOrders,
  acceptOrder,
  rejectOrder,
  toOrderViMessage,
  orderStatusLabel,
  buyerDisplayName as orderBuyerDisplayName,
  productDisplayName,
  type OrderDto,
} from '../../../services/orderService';
import {
  createProposal,
  toProposalViMessage,
} from '../../../services/proposalService';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  toContractViMessage,
  partyFarmerLabel,
  partyBuyerLabel,
  type ContractDto,
} from '../../../services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { ContractChangeRequestsPanel } from '@/screens/shared/contract-change-requests';

export interface TraderTradingOrdersScreenProps {
  traderId?: string;
  traderName?: string;
}

type TabType = 'my-products' | 'buying-requests' | 'orders' | 'contracts';

// ── Sub-components ─────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
    }}
  >
    <div style={{ display: 'flex', gap: spacing.md }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          backgroundColor: colors.background.secondary,
          borderRadius: '8px',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        {[80, 60, 50].map((w, i) => (
          <div
            key={i}
            style={{
              height: '12px',
              width: `${w}%`,
              backgroundColor: colors.background.secondary,
              borderRadius: '6px',
              marginBottom: spacing.xs,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ── Create/Edit product modal (inline form) ───────────────────────────────────

interface ProductFormProps {
  initial?: Partial<CreateProductDto & { status: 'active' | 'inactive' }>;
  onSave: (data: CreateProductDto) => void;
  onCancel: () => void;
  saving: boolean;
}

const CROP_OPTIONS = Object.entries(CROP_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ProductForm: React.FC<ProductFormProps> = ({
  initial,
  onSave,
  onCancel,
  saving,
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [cropType, setCropType] = useState(initial?.cropType ?? 'durian');
  const [price, setPrice] = useState(initial?.price?.toString() ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? 'kg');
  const [stock, setStock] = useState(initial?.stockQuantity?.toString() ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text.Title size="small" style={{ margin: 0 }}>
            {initial?.name ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới'}
          </Text.Title>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: spacing.xs,
            }}
            onClick={onCancel}
            aria-label="Đóng"
          >
            <Icon name="close" size="md" color={colors.text.secondary} />
          </button>
        </div>

        <label style={labelStyle}>Tên sản phẩm *</label>
        <input
          style={inputStyle}
          placeholder="Ví dụ: Sầu riêng Monthong"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label style={labelStyle}>Loại cây trồng *</label>
        <select
          style={{ ...inputStyle }}
          value={cropType}
          onChange={(e) => setCropType(e.target.value)}
        >
          {CROP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Giá (VNĐ) *</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="VD: 120000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Đơn vị</label>
            <input
              style={inputStyle}
              placeholder="kg"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>

        <label style={labelStyle}>Tồn kho (kg)</label>
        <input
          style={inputStyle}
          type="number"
          placeholder="VD: 500"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <label style={labelStyle}>Mô tả</label>
        <textarea
          style={{ ...inputStyle, height: '80px', resize: 'none' }}
          placeholder="Mô tả chất lượng, đặc điểm nổi bật..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            style={{
              flex: 1,
              padding: spacing.md,
              backgroundColor: colors.background.secondary,
              border: 'none',
              borderRadius: '8px',
              fontSize: fontSize.body,
              cursor: 'pointer',
            }}
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            style={{
              flex: 2,
              padding: spacing.md,
              backgroundColor: saving ? colors.background.tertiary : colors.primary.zaloBlue,
              color: colors.text.inverse,
              border: 'none',
              borderRadius: '8px',
              fontSize: fontSize.body,
              fontWeight: fontWeight.semibold,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
            disabled={saving}
            onClick={() => {
              if (!name.trim() || !price) return;
              onSave({
                name: name.trim(),
                cropType,
                unit: unit.trim() || 'kg',
                price: parseFloat(price),
                stockQuantity: stock ? parseInt(stock, 10) : undefined,
                description: description.trim() || undefined,
              });
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * Trader Trading & Orders Screen Component
 * Requirements: FR-T03, FR-T04, FR-T05, FR-T06, US-T03
 */
export const TraderTradingOrdersScreen: React.FC<TraderTradingOrdersScreenProps> = ({
  traderId = 'trader-001',
  traderName = 'Thương lái',
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState<TabType>('my-products');
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  // Products state
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Buying requests state
  const [buyingRequests, setBuyingRequests] = useState<BuyingRequestDto[]>([]);
  const [brLoading, setBrLoading] = useState(false);
  const [brError, setBrError] = useState<string | null>(null);

  // Orders state (Phase 11.2 — orderService)
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // Contracts (Phase 12.2 — contractService)
  const [contractItems, setContractItems] = useState<ContractDto[]>([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractLoaded, setContractLoaded] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  // In-flight action
  const [actionId, setActionId] = useState<string | null>(null);

  // Proposal form state
  const [proposingFor, setProposingFor] = useState<BuyingRequestDto | null>(null);
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalNote, setProposalNote] = useState('');
  const [proposalSaving, setProposalSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load trader's products — server filters by traderId in Bearer token
  const loadProducts = () => {
    setProductsLoading(true);
    setProductsError(null);
    listProducts({ traderId, status: 'all' })
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
  };

  useEffect(() => {
    loadProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traderId]);

  // Load open buying requests
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load orders — server lọc theo trader từ JWT
  const loadOrders = useCallback(() => {
    setOrdersLoading(true);
    setOrdersError(null);
    listOrders()
      .then((res) => {
        setOrders(res.items);
        setOrdersLoaded(true);
        setOrdersLoading(false);
      })
      .catch((err: unknown) => {
        const msg = toOrderViMessage(err, 'list');
        setOrdersError(msg);
        setOrdersLoading(false);
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContracts = useCallback(() => {
    setContractLoading(true);
    setContractError(null);
    listContracts({
      role: 'trader',
      page: 1,
      limit: 50,
    })
      .then((res) => {
        setContractItems(res.items);
        setContractLoaded(true);
      })
      .catch((err: unknown) => {
        const msg = toContractViMessage(err, 'list');
        setContractError(msg);
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
      })
      .then(() => setContractLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'buying-requests' && buyingRequests.length === 0 && !brLoading && !brError) {
      loadBuyingRequests();
    }
    if (activeTab === 'orders' && !ordersLoaded && !ordersLoading) {
      loadOrders();
    }
    if (activeTab === 'contracts' && !contractLoaded && !contractLoading) {
      loadContracts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleAcceptOrder = async (id: string) => {
    setActionId(id);
    try {
      const updated = await acceptOrder(id);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOrder?.id === id) setSelectedOrder(updated);
      openSnackbar({ type: 'success', text: '✓ Đã xác nhận đơn hàng!', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toOrderViMessage(err, 'accept'), duration: 4000, icon: true });
    } finally {
      setActionId(null);
    }
  };

  const handleRejectOrder = async (id: string) => {
    setActionId(id);
    try {
      const updated = await rejectOrder(id);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOrder?.id === id) setSelectedOrder(updated);
      openSnackbar({ type: 'success', text: 'Đã từ chối đơn hàng.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toOrderViMessage(err, 'reject'), duration: 4000, icon: true });
    } finally {
      setActionId(null);
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
      openSnackbar({ type: 'success', text: '✓ Đã gửi đề xuất tới người mua!', duration: 3000, icon: true });
      setProposingFor(null);
      setProposalPrice('');
      setProposalNote('');
    } catch (err) {
      openSnackbar({ type: 'error', text: toProposalViMessage(err, 'create'), duration: 4000, icon: true });
    } finally {
      setProposalSaving(false);
    }
  };

  const handleSaveProduct = async (data: CreateProductDto) => {
    setFormSaving(true);
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, {
          name: data.name,
          price: data.price,
          stockQuantity: data.stockQuantity,
          description: data.description,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        openSnackbar({ type: 'success', text: 'Cập nhật sản phẩm thành công!', duration: 3000, icon: true });
      } else {
        const created = await createProduct(data);
        setProducts((prev) => [created, ...prev]);
        openSnackbar({ type: 'success', text: 'Tạo sản phẩm thành công!', duration: 3000, icon: true });
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (err: unknown) {
      const context = editingProduct ? 'update' : 'create';
      openSnackbar({
        type: 'error',
        text: toMarketplaceViMessage(err, context),
        duration: 4000,
        icon: true,
      });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      // Server thực hiện soft delete; phản ánh ngay trên UI
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'inactive' as const } : p)),
      );
      openSnackbar({ type: 'success', text: 'Đã ẩn sản phẩm.', duration: 3000, icon: true });
    } catch (err: unknown) {
      openSnackbar({
        type: 'error',
        text: toMarketplaceViMessage(err, 'delete'),
        duration: 4000,
        icon: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const getContractStatusColor = (status: ContractDto['status']): string => {
    switch (status) {
      case 'active':
        return colors.primary.agriGreen;
      case 'pending_change':
        return colors.functional.warningYellow;
      case 'completed':
        return colors.primary.zaloBlue;
      case 'cancelled':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getOrderStatusColor = (status: OrderDto['status']): string => {
    switch (status) {
      case 'pending':    return colors.functional.warningYellow;
      case 'accepted':   return colors.primary.zaloBlue;
      case 'contracted': return colors.primary.agriGreen;
      case 'completed':  return colors.primary.agriGreen;
      case 'rejected':   return colors.functional.alertRed;
      case 'cancelled':  return colors.text.secondary;
      default:           return colors.text.secondary;
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────────

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    overflowX: 'auto',
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  };

  const cardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
    transition: 'all 0.2s',
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
  };

  const fabStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: spacing.xl,
    right: spacing.md,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: colors.primary.zaloBlue,
    border: 'none',
    boxShadow: '0 4px 12px rgba(0, 104, 255, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    zIndex: 1000,
  };

  // ── Tab renderers ─────────────────────────────────────────────────────────────

  const renderMyProductsTab = () => {
    if (productsLoading) {
      return (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (productsError) {
      return (
        <div style={{ textAlign: 'center', padding: spacing.lg }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>
            {productsError}
          </Text>
          <button
            style={{ ...actionButtonStyles(true), marginTop: spacing.md, flex: 'none' }}
            onClick={loadProducts}
          >
            Thử lại
          </button>
        </div>
      );
    }

    const activeProducts = products.filter((p) => p.status === 'active');
    const inactiveProducts = products.filter((p) => p.status === 'inactive');

    const renderProductCard = (product: ProductDto) => {
      const isDeleting = deletingId === product.id;
      const emoji = product.images[0] ?? cropEmoji(product.cropType);
      const std = standardLabel(product.standardCode);

      return (
        <div key={product.id} style={{ ...cardStyles, opacity: product.status === 'inactive' ? 0.65 : 1 }}>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: colors.background.secondary,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                flexShrink: 0,
              }}
            >
              {emoji}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {product.name}
                  </Text.Title>
                  {std && (
                    <Text size="xSmall" style={{ color: colors.primary.agriGreen, margin: 0 }}>
                      {std}
                    </Text>
                  )}
                </div>
                <div
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor:
                      product.status === 'active'
                        ? `${colors.primary.agriGreen}15`
                        : `${colors.text.secondary}15`,
                    borderRadius: '6px',
                  }}
                >
                  <Text
                    size="xSmall"
                    style={{
                      color:
                        product.status === 'active'
                          ? colors.primary.agriGreen
                          : colors.text.secondary,
                      fontWeight: fontWeight.semibold,
                    }}
                  >
                    {product.status === 'active' ? 'Đang bán' : 'Đã ẩn'}
                  </Text>
                </div>
              </div>

              <div style={{ marginTop: spacing.sm }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    marginBottom: spacing.xs,
                  }}
                >
                  <Icon name="dollar-sign" size="sm" color={colors.primary.zaloBlue} />
                  <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                    {product.price.toLocaleString('vi-VN')} VNĐ/{product.unit}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name="package" size="sm" color={colors.text.secondary} />
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    Tồn kho:{' '}
                    {product.stockQuantity !== undefined
                      ? `${product.stockQuantity} ${product.unit}`
                      : 'Không giới hạn'}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
            <button
              style={dangerButtonStyles}
              disabled={isDeleting || product.status === 'inactive'}
              onClick={() => handleDeleteProduct(product.id)}
            >
              {isDeleting ? '...' : 'Ẩn'}
            </button>
            <button
              style={actionButtonStyles(false)}
              onClick={() => {
                setEditingProduct(product);
                setShowForm(true);
              }}
            >
              Chỉnh sửa
            </button>
            <button style={actionButtonStyles(true)}>Xem chi tiết</button>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text.Title size="small">
            Kho hàng ({activeProducts.length} đang bán
            {inactiveProducts.length > 0 ? `, ${inactiveProducts.length} đã ẩn` : ''})
          </Text.Title>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing.lg }}>
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📦</div>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Chưa có sản phẩm nào. Tạo mới để bắt đầu!
            </Text>
          </div>
        ) : (
          products.map(renderProductCard)
        )}

        <button
          style={fabStyles}
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          aria-label="Tạo sản phẩm mới"
        >
          <Icon name="add" size="lg" color={colors.text.inverse} />
        </button>
      </div>
    );
  };

  const renderBuyingRequestsTab = () => {
    if (brLoading) {
      return (
        <div>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            Nhu cầu công khai
          </Text.Title>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (brError) {
      return (
        <div style={{ textAlign: 'center', padding: spacing.lg }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>
            {brError}
          </Text>
          <button
            style={{ ...actionButtonStyles(true), marginTop: spacing.md, flex: 'none' }}
            onClick={loadBuyingRequests}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (buyingRequests.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🛒</div>
          <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
            Chưa có nhu cầu mua nào
          </Text.Title>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Người mua chưa đăng yêu cầu nào đang mở
          </Text>
        </div>
      );
    }

    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text.Title size="small">
            Nhu cầu công khai ({buyingRequests.length})
          </Text.Title>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.primary.zaloBlue,
              fontSize: fontSize.caption,
              fontWeight: fontWeight.medium,
              padding: 0,
            }}
            onClick={loadBuyingRequests}
          >
            Làm mới
          </button>
        </div>

        {buyingRequests.map((req) => {
          const cropName = cropLabelBR(req.cropType);
          const stdName = standardLabelBR(req.qualityStandardCode);
          const buyerName = buyerDisplayName(req.buyerId);
          const deliveryDate = new Date(req.deliveryDate).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          });
          const ageDays = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          const ageLabel = ageDays === 0 ? 'Hôm nay' : ageDays === 1 ? '1 ngày trước' : `${ageDays} ngày trước`;

          return (
            <div key={req.id} style={cardStyles}>
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm,
                }}
              >
                <div>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {buyerName}
                  </Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    {ageLabel}
                  </Text>
                </div>
                <div
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: `${colors.primary.agriGreen}15`,
                    borderRadius: '6px',
                  }}
                >
                  <Text
                    size="xSmall"
                    style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.semibold }}
                  >
                    {cropName}
                  </Text>
                </div>
              </div>

              {/* Details grid */}
              <div
                style={{
                  padding: spacing.sm,
                  backgroundColor: colors.background.secondary,
                  borderRadius: '6px',
                  marginBottom: spacing.sm,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: `${spacing.xs} ${spacing.md}`,
                }}
              >
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Số lượng</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.medium }}>
                    {req.quantity} {req.unit}
                  </Text>
                </div>
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Giá kỳ vọng</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.medium }}>
                    {req.expectedPrice
                      ? `${req.expectedPrice.toLocaleString('vi-VN')} VNĐ/${req.unit}`
                      : 'Thương lượng'}
                  </Text>
                </div>
                {stdName && (
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Tiêu chuẩn</Text>
                    <Text size="small" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.medium }}>
                      {stdName}
                    </Text>
                  </div>
                )}
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Ngày giao</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.medium }}>
                    {deliveryDate}
                  </Text>
                </div>
              </div>

              {/* Deposit badge */}
              {req.depositOffered && (
                <div
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: `${colors.primary.zaloBlue}10`,
                    borderRadius: '6px',
                    marginBottom: spacing.sm,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                >
                  <Icon name="dollar-sign" size="sm" color={colors.primary.zaloBlue} />
                  <Text size="xSmall" style={{ color: colors.primary.zaloBlue, fontWeight: fontWeight.medium }}>
                    Cọc: {req.depositOffered.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </div>
              )}

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button style={actionButtonStyles(false)}>Xem chi tiết</button>
                <button
                  style={actionButtonStyles(true)}
                  onClick={() => {
                    setProposingFor(req);
                    setProposalPrice(req.expectedPrice?.toString() ?? '');
                  }}
                >
                  Gửi đề xuất
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrdersTab = () => {
    if (ordersLoading) {
      return (
        <div>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>Quản lý Đơn hàng</Text.Title>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (ordersError) {
      return (
        <div style={{ textAlign: 'center', padding: spacing.lg }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>{ordersError}</Text>
          <button
            style={{ ...actionButtonStyles(true), marginTop: spacing.md, flex: 'none' }}
            onClick={loadOrders}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📋</div>
          <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
            Chưa có đơn hàng nào
          </Text.Title>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Người mua đặt hàng trực tiếp sẽ xuất hiện tại đây
          </Text>
        </div>
      );
    }

    return (
      <div>
        <Text.Title size="small" style={{ marginBottom: spacing.md }}>
          Quản lý Đơn hàng ({orders.length})
        </Text.Title>

        {orders.map((order) => {
          const statusColor = getOrderStatusColor(order.status);
          const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          });
          const isActing = actionId === order.id;

          return (
            <div
              key={order.id}
              style={{ ...cardStyles, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setSelectedOrder(order)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                <div>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {orderBuyerDisplayName(order.buyerId)}
                  </Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    {productDisplayName(order.productId)}
                  </Text>
                </div>
                <div style={{ padding: `${spacing.xs} ${spacing.sm}`, backgroundColor: `${statusColor}15`, borderRadius: '6px' }}>
                  <Text size="xSmall" style={{ color: statusColor, fontWeight: fontWeight.semibold }}>
                    {orderStatusLabel(order.status)}
                  </Text>
                </div>
              </div>

              <div style={{ padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: '6px', margin: `${spacing.sm} 0` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Số lượng:</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{order.quantity} {order.unit}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Tổng giá trị:</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{formatCurrency(order.totalPrice)}</Text>
                </div>
                {order.deposit != null && order.deposit > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Đã đặt cọc:</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen }}>
                      {formatCurrency(order.deposit)}
                    </Text>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
                <Icon name="clock" size="sm" color={colors.text.secondary} />
                <Text size="xSmall" style={{ color: colors.text.secondary }}>{orderDate}</Text>
              </div>

              {order.status === 'pending' && (
                <div style={{ display: 'flex', gap: spacing.sm }} onClick={(e) => e.stopPropagation()}>
                  <button
                    style={{ ...dangerButtonStyles, opacity: isActing ? 0.6 : 1 }}
                    disabled={isActing}
                    onClick={() => handleRejectOrder(order.id)}
                  >
                    {isActing ? '...' : 'Từ chối'}
                  </button>
                  <button
                    style={{ ...actionButtonStyles(true), opacity: isActing ? 0.6 : 1 }}
                    disabled={isActing}
                    onClick={() => handleAcceptOrder(order.id)}
                  >
                    {isActing ? '...' : 'Xác nhận'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {selectedOrder && renderOrderDetail(selectedOrder)}
      </div>
    );
  };

  const renderOrderDetail = (order: OrderDto) => {
    const statusColor = getOrderStatusColor(order.status);
    const isActing = actionId === order.id;
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

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
        onClick={() => setSelectedOrder(null)}
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
            <Text.Title size="small" style={{ margin: 0 }}>Chi tiết Đơn hàng</Text.Title>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedOrder(null)} aria-label="Đóng">
              <Icon name="close" size="md" color={colors.text.secondary} />
            </button>
          </div>

          <div style={{ padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: '8px', marginBottom: spacing.md }}>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>Người mua</Text>
            <Text.Title size="small" style={{ margin: 0 }}>{orderBuyerDisplayName(order.buyerId)}</Text.Title>
            <div style={{ display: 'inline-block', padding: `${spacing.xs} ${spacing.sm}`, backgroundColor: `${statusColor}15`, borderRadius: '6px', margin: `${spacing.xs} 0` }}>
              <Text size="small" style={{ color: statusColor, fontWeight: fontWeight.semibold }}>{orderStatusLabel(order.status)}</Text>
            </div>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>Sản phẩm</Text>
            <Text size="small" style={{ fontWeight: fontWeight.medium }}>{productDisplayName(order.productId)}</Text>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>Số lượng</Text>
            <Text size="small" style={{ fontWeight: fontWeight.medium }}>{order.quantity} {order.unit}</Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <Text size="small" style={{ color: colors.text.secondary }}>Tổng giá trị:</Text>
              <Text size="small" style={{ fontWeight: fontWeight.bold }}>{formatCurrency(order.totalPrice)}</Text>
            </div>
            {order.deposit != null && order.deposit > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text size="small" style={{ color: colors.text.secondary }}>Đã đặt cọc:</Text>
                <Text size="small" style={{ fontWeight: fontWeight.bold, color: colors.primary.agriGreen }}>{formatCurrency(order.deposit)}</Text>
              </div>
            )}
            <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>Ngày đặt: {orderDate}</Text>
          </div>

          <div style={{ padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: '8px', marginBottom: spacing.md }}>
            <Text.Title size="small" style={{ marginBottom: spacing.sm }}>Nguồn cung</Text.Title>
            <button style={{ ...actionButtonStyles(true), width: '100%' }}>
              Gán vườn nông dân (Phase 12)
            </button>
          </div>

          {order.status === 'pending' && (
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <button
                style={{ ...dangerButtonStyles, flex: 1, opacity: isActing ? 0.6 : 1 }}
                disabled={isActing}
                onClick={() => handleRejectOrder(order.id)}
              >
                {isActing ? '...' : 'Từ chối'}
              </button>
              <button
                style={{ ...actionButtonStyles(true), opacity: isActing ? 0.6 : 1 }}
                disabled={isActing}
                onClick={() => handleAcceptOrder(order.id)}
              >
                {isActing ? '...' : 'Xác nhận đơn hàng'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContractsTab = () => {
    if (contractLoading && !contractLoaded) {
      return (
        <div>
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }
    if (contractError && contractItems.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: spacing.lg }}>
          <Text size="small" style={{ color: colors.functional.alertRed }}>{contractError}</Text>
          <button type="button" style={{ ...actionButtonStyles(true), marginTop: spacing.md }} onClick={loadContracts}>
            Thử lại
          </button>
        </div>
      );
    }

    return (
      <div>
        <Text.Title size="small" style={{ marginBottom: spacing.md }}>
          Hợp đồng ({contractItems.length})
        </Text.Title>
        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.md, display: 'block' }}>
          Danh sách theo vai trò thương lái trên máy chủ (JWT).
        </Text>
        {contractItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
            <Text size="small">Chưa có hợp đồng</Text>
          </div>
        ) : (
          contractItems.map((c) => {
            const statusColor = getContractStatusColor(c.status);
            const partyLine =
              c.contractType === 'farmer_trader'
                ? `Nông dân: ${c.partyFarmerId ? partyFarmerLabel(c.partyFarmerId) : '—'}`
                : `Người mua: ${c.partyBuyerId ? partyBuyerLabel(c.partyBuyerId) : '—'}`;
            const start = new Date(c.startDate).toLocaleDateString('vi-VN');
            const end = new Date(c.endDate).toLocaleDateString('vi-VN');

            return (
              <div key={c.id} style={cardStyles}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      {contractTypeLabelVi(c.contractType)}
                    </Text>
                    <Text.Title size="small" style={{ margin: 0 }}>
                      {c.productId ? productDisplayName(c.productId) : 'Sản phẩm'}
                    </Text.Title>
                    <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                      {partyLine}
                    </Text>
                  </div>
                  <span
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: `${statusColor}18`,
                      color: statusColor,
                      borderRadius: '6px',
                      fontSize: fontSize.small,
                      fontWeight: fontWeight.semibold,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {contractStatusLabelVi(c.status)}
                  </span>
                </div>
                <div style={{ padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Khối lượng</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                      {c.quantity} {c.unit}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Tổng giá trị</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{formatCurrency(c.totalPrice)}</Text>
                  </div>
                  {c.deposit != null && c.deposit > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
                      <Text size="xSmall" style={{ color: colors.text.secondary }}>Đặt cọc</Text>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen }}>
                        {formatCurrency(c.deposit)}
                      </Text>
                    </div>
                  )}
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
                    Hiệu lực: {start} — {end}
                  </Text>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedContractId((x) => (x === c.id ? null : c.id))}
                  style={{
                    marginTop: spacing.md,
                    width: '100%',
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: '8px',
                    border: `1px solid ${colors.primary.zaloBlue}`,
                    backgroundColor: expandedContractId === c.id ? `${colors.primary.zaloBlue}12` : 'transparent',
                    color: colors.primary.zaloBlue,
                    fontSize: fontSize.small,
                    fontWeight: fontWeight.semibold,
                    cursor: 'pointer',
                  }}
                >
                  {expandedContractId === c.id ? 'Ẩn yêu cầu thay đổi' : 'Yêu cầu thay đổi hợp đồng'}
                </button>
                {expandedContractId === c.id && (
                  <ContractChangeRequestsPanel
                    contractId={c.id}
                    contract={c}
                    viewerRole="trader"
                    onMutationSuccess={loadContracts}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────────

  return (
    <Page className="trader-trading-orders-screen">
      <div style={headerStyles}>
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Sàn giao dịch
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          {traderName}
        </Text.Title>
      </div>

      <div style={tabBarStyles}>
        {(
          [
            { id: 'my-products', label: 'Kho hàng' },
            {
              id: 'buying-requests',
              label: brLoading
                ? 'Nhu cầu...'
                : buyingRequests.length > 0
                ? `Nhu cầu (${buyingRequests.length})`
                : 'Nhu cầu',
            },
            {
              id: 'orders',
              label: ordersLoaded && orders.length > 0
                ? `Đơn hàng (${orders.length})`
                : 'Đơn hàng',
            },
            {
              id: 'contracts',
              label:
                contractLoaded && contractItems.length > 0
                  ? `HĐ (${contractItems.length})`
                  : 'Hợp đồng',
            },
          ] as { id: TabType; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            style={tabButtonStyles(activeTab === id)}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={contentStyles}>
        {activeTab === 'my-products' && renderMyProductsTab()}
        {activeTab === 'buying-requests' && renderBuyingRequestsTab()}
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'contracts' && renderContractsTab()}
      </div>

      {/* Proposal Form Modal */}
      {proposingFor && (
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
          onClick={() => setProposingFor(null)}
        >
          <div
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: '16px 16px 0 0',
              padding: spacing.md,
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text.Title size="small" style={{ margin: 0 }}>Gửi đề xuất giá</Text.Title>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setProposingFor(null)} aria-label="Đóng">
                <Icon name="close" size="md" color={colors.text.secondary} />
              </button>
            </div>

            <div style={{ padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: '8px', marginBottom: spacing.md }}>
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

            <label style={{ fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, display: 'block', marginBottom: '4px' }}>
              Giá đề xuất (₫/{proposingFor.unit}) *
            </label>
            <input
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.background.tertiary}`,
                borderRadius: '6px',
                fontSize: fontSize.body,
                marginBottom: spacing.sm,
                boxSizing: 'border-box',
              }}
              type="number"
              placeholder={`VD: ${proposingFor.expectedPrice ?? 50000}`}
              value={proposalPrice}
              onChange={(e) => setProposalPrice(e.target.value)}
            />

            <label style={{ fontSize: fontSize.caption, fontWeight: fontWeight.medium, color: colors.text.secondary, display: 'block', marginBottom: '4px' }}>
              Ghi chú (tùy chọn)
            </label>
            <textarea
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.background.tertiary}`,
                borderRadius: '6px',
                fontSize: fontSize.body,
                marginBottom: spacing.md,
                height: '72px',
                resize: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="Thêm thông tin về chất lượng, nguồn gốc, thời gian giao hàng..."
              value={proposalNote}
              onChange={(e) => setProposalNote(e.target.value)}
            />

            <div style={{ display: 'flex', gap: spacing.sm }}>
              <button
                style={{
                  flex: 1,
                  padding: spacing.md,
                  backgroundColor: colors.background.secondary,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: fontSize.body,
                  cursor: 'pointer',
                }}
                onClick={() => setProposingFor(null)}
              >
                Hủy
              </button>
              <button
                style={{
                  flex: 2,
                  padding: spacing.md,
                  backgroundColor: proposalSaving ? colors.background.tertiary : colors.primary.zaloBlue,
                  color: colors.text.inverse,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: fontSize.body,
                  fontWeight: fontWeight.semibold,
                  cursor: proposalSaving || !proposalPrice ? 'not-allowed' : 'pointer',
                  opacity: !proposalPrice ? 0.6 : 1,
                }}
                disabled={proposalSaving || !proposalPrice}
                onClick={handleSendProposal}
              >
                {proposalSaving ? 'Đang gửi...' : 'Gửi đề xuất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          initial={
            editingProduct
              ? {
                  name: editingProduct.name,
                  cropType: editingProduct.cropType,
                  price: editingProduct.price,
                  unit: editingProduct.unit,
                  stockQuantity: editingProduct.stockQuantity,
                  description: editingProduct.description,
                }
              : undefined
          }
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          saving={formSaving}
        />
      )}
    </Page>
  );
};

export default TraderTradingOrdersScreen;
