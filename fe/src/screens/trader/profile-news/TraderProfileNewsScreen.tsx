/**
 * Trader Profile & News Screen
 * Quản lý thương hiệu và truyền thông thị trường
 * 
 * Requirements: FR-T01, FR-T12, US-T05
 * 
 * Features:
 * - Phần Thông tin Doanh nghiệp: Logo, Tên đơn vị, Giấy phép, Mô tả năng lực
 * - Phần Quản lý Tin tức: Trình soạn thảo văn bản đơn giản, Viết bài
 * - Lịch sử đăng bài: Danh sách bài viết đã đăng, Số lượt xem và tương tác
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface TraderProfileNewsScreenProps {
  traderName?: string;
  companyName?: string;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: 'price-forecast' | 'farming-tips';
  views: number;
  likes: number;
  publishedDate: Date;
}

/**
 * Trader Profile & News Screen Component
 * Requirements: FR-T01, FR-T12, US-T05
 */
export const TraderProfileNewsScreen: React.FC<TraderProfileNewsScreenProps> = ({
  traderName = 'Tiến Khoa',
  companyName = 'Công ty TNHH Nông sản Sầu riêng Monthong',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'news'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isWritingArticle, setIsWritingArticle] = useState(false);
  
  // Company profile state
  const [companyProfile, setCompanyProfile] = useState({
    logo: '🏢',
    name: companyName,
    license: 'GP-2024-001234',
    description: 'Chuyên cung cấp sầu riêng Monthong chất lượng cao, tuân thủ tiêu chuẩn VietGAP và GlobalGAP. Với hơn 10 năm kinh nghiệm trong ngành.',
    address: 'Khu vực Đồng bằng sông Cửu Long',
    phone: '0901234567',
    email: 'contact@monthong.vn',
  });

  // News article state
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: 'price-forecast' as 'price-forecast' | 'farming-tips',
  });

  // Mock published articles - Requirements FR-T12
  const [publishedArticles, setPublishedArticles] = useState<NewsArticle[]>([
    {
      id: '1',
      title: 'Dự báo giá sầu riêng tháng 12/2024',
      content: 'Giá sầu riêng dự kiến tăng 15% do nhu cầu cao trong dịp Tết...',
      category: 'price-forecast',
      views: 1250,
      likes: 89,
      publishedDate: new Date('2024-12-01'),
    },
    {
      id: '2',
      title: 'Kỹ thuật bón phân giai đoạn ra hoa',
      content: 'Trong giai đoạn ra hoa, cây cần bổ sung kali và photpho để tăng tỷ lệ đậu quả...',
      category: 'farming-tips',
      views: 856,
      likes: 67,
      publishedDate: new Date('2024-11-28'),
    },
    {
      id: '3',
      title: 'Thị trường xuất khẩu Trung Quốc mở rộng',
      content: 'Cơ hội mới cho nông dân với việc Trung Quốc tăng hạn ngạch nhập khẩu...',
      category: 'price-forecast',
      views: 2100,
      likes: 145,
      publishedDate: new Date('2024-11-25'),
    },
  ]);

  // Styles
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
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isActive ? colors.background.primary : 'transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.body,
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
    backgroundColor: variant === 'primary' ? colors.primary.zaloBlue : 
                     variant === 'secondary' ? colors.primary.agriGreen : 
                     'transparent',
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
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const categoryBadgeStyles = (category: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: category === 'price-forecast' ? `${colors.primary.zaloBlue}15` : `${colors.primary.agriGreen}15`,
    color: category === 'price-forecast' ? colors.primary.zaloBlue : colors.primary.agriGreen,
    borderRadius: '6px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
  });

  const statsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.md,
    marginTop: spacing.sm,
  };

  const statItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    color: colors.text.secondary,
    fontSize: fontSize.small,
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    // In real app, save to backend
    console.log('Profile saved:', companyProfile);
  };

  const handlePublishArticle = () => {
    if (newArticle.title && newArticle.content) {
      const article: NewsArticle = {
        id: Date.now().toString(),
        title: newArticle.title,
        content: newArticle.content,
        category: newArticle.category,
        views: 0,
        likes: 0,
        publishedDate: new Date(),
      };
      setPublishedArticles([article, ...publishedArticles]);
      setNewArticle({ title: '', content: '', category: 'price-forecast' });
      setIsWritingArticle(false);
      console.log('Article published:', article);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category === 'price-forecast' ? 'Dự báo giá' : 'Kỹ thuật canh tác';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Page className="trader-profile-news-screen">
      {/* Header */}
      <div style={headerStyles}>
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Quản lý
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          Hồ sơ & Tin tức
        </Text.Title>
      </div>

      {/* Tab Navigation */}
      <div style={tabContainerStyles}>
        <button
          style={tabButtonStyles(activeTab === 'profile')}
          onClick={() => setActiveTab('profile')}
        >
          Thông tin Doanh nghiệp
        </button>
        <button
          style={tabButtonStyles(activeTab === 'news')}
          onClick={() => setActiveTab('news')}
        >
          Quản lý Tin tức
        </button>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div style={profileCardStyles}>
              {/* Logo */}
              <div style={logoContainerStyles}>
                {companyProfile.logo}
              </div>

              {/* Company Name */}
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

              {/* License */}
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

              {/* Description */}
              <div style={fieldStyles}>
                <label style={labelStyles}>Mô tả năng lực</label>
                {isEditing ? (
                  <textarea
                    style={textareaStyles}
                    value={companyProfile.description}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, description: e.target.value })}
                  />
                ) : (
                  <Text style={{ margin: 0, lineHeight: 1.6 }}>
                    {companyProfile.description}
                  </Text>
                )}
              </div>

              {/* Address */}
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

              {/* Contact Info */}
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}>
                {isEditing ? (
                  <>
                    <button
                      style={buttonStyles('primary')}
                      onClick={handleSaveProfile}
                    >
                      <Icon name="check" size="sm" color={colors.text.inverse} />
                      Lưu thay đổi
                    </button>
                    <button
                      style={buttonStyles('outline')}
                      onClick={() => setIsEditing(false)}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button
                    style={buttonStyles('primary')}
                    onClick={() => setIsEditing(true)}
                  >
                    <Icon name="edit" size="sm" color={colors.text.inverse} />
                    Chỉnh sửa thông tin
                  </button>
                )}
              </div>
            </div>

            {/* Public Display Note */}
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

        {/* News Tab */}
        {activeTab === 'news' && (
          <div>
            {/* Write Article Section */}
            {!isWritingArticle ? (
              <button
                style={{
                  ...buttonStyles('primary'),
                  width: '100%',
                  justifyContent: 'center',
                  marginBottom: spacing.lg,
                }}
                onClick={() => setIsWritingArticle(true)}
              >
                <Icon name="edit" size="md" color={colors.text.inverse} />
                Viết bài mới
              </button>
            ) : (
              <div style={profileCardStyles}>
                <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                  Viết bài mới
                </Text.Title>

                {/* Category Selection */}
                <div style={fieldStyles}>
                  <label style={labelStyles}>Danh mục</label>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button
                      style={{
                        ...buttonStyles(newArticle.category === 'price-forecast' ? 'primary' : 'outline'),
                        flex: 1,
                        justifyContent: 'center',
                      }}
                      onClick={() => setNewArticle({ ...newArticle, category: 'price-forecast' })}
                    >
                      Dự báo giá
                    </button>
                    <button
                      style={{
                        ...buttonStyles(newArticle.category === 'farming-tips' ? 'secondary' : 'outline'),
                        flex: 1,
                        justifyContent: 'center',
                      }}
                      onClick={() => setNewArticle({ ...newArticle, category: 'farming-tips' })}
                    >
                      Kỹ thuật canh tác
                    </button>
                  </div>
                </div>

                {/* Title */}
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

                {/* Content */}
                <div style={fieldStyles}>
                  <label style={labelStyles}>Nội dung</label>
                  <textarea
                    style={{ ...textareaStyles, minHeight: '200px' }}
                    placeholder="Nhập nội dung bài viết..."
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: spacing.md }}>
                  <button
                    style={buttonStyles('primary')}
                    onClick={handlePublishArticle}
                    disabled={!newArticle.title || !newArticle.content}
                  >
                    <Icon name="check" size="sm" color={colors.text.inverse} />
                    Đăng bài
                  </button>
                  <button
                    style={buttonStyles('outline')}
                    onClick={() => {
                      setIsWritingArticle(false);
                      setNewArticle({ title: '', content: '', category: 'price-forecast' });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Published Articles List */}
            <div>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Lịch sử đăng bài ({publishedArticles.length})
              </Text.Title>

              {publishedArticles.map((article) => (
                <div
                  key={article.id}
                  style={articleCardStyles}
                  onClick={() => console.log('View article:', article.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Category Badge */}
                  <div style={{ marginBottom: spacing.sm }}>
                    <span style={categoryBadgeStyles(article.category)}>
                      {getCategoryLabel(article.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.xs }}>
                    {article.title}
                  </Text.Title>

                  {/* Content Preview */}
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
                    {article.content}
                  </Text>

                  {/* Stats */}
                  <div style={statsContainerStyles}>
                    <div style={statItemStyles}>
                      <Icon name="eye" size="sm" color={colors.text.secondary} />
                      <span>{article.views.toLocaleString()} lượt xem</span>
                    </div>
                    <div style={statItemStyles}>
                      <Icon name="heart" size="sm" color={colors.text.secondary} />
                      <span>{article.likes} tương tác</span>
                    </div>
                    <div style={statItemStyles}>
                      <Icon name="calendar" size="sm" color={colors.text.secondary} />
                      <span>{formatDate(article.publishedDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};

export default TraderProfileNewsScreen;
