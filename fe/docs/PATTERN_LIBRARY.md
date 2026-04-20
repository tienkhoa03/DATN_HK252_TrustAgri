# Pattern Library - Zalo Mini App Design System

Thư viện các pattern thiết kế và tương tác phổ biến trong ứng dụng.

## Table of Contents

- [Navigation Patterns](#navigation-patterns)
- [Layout Patterns](#layout-patterns)
- [Interaction Patterns](#interaction-patterns)
- [Data Display Patterns](#data-display-patterns)
- [Form Patterns](#form-patterns)
- [Feedback Patterns](#feedback-patterns)
- [Role-Specific Patterns](#role-specific-patterns)

---

## Navigation Patterns

### Pattern 1: Bottom Navigation (Farmer Role)

**Use Case:** Primary navigation for farmer role with 4 main sections

**Structure:**
```
┌─────────────────────────────────┐
│         Content Area            │
├─────────────────────────────────┤
│ [Home] [Monitor] [Alert] [User] │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
<BottomNavigation
  items={[
    { label: 'Trang chủ', icon: 'home' },
    { label: 'Giám sát', icon: 'monitor' },
    { label: 'Cảnh báo', icon: 'alert', badge: 3 },
    { label: 'Hồ sơ', icon: 'user' }
  ]}
  activeIndex={activeTab}
  onChange={setActiveTab}
/>
```

**Guidelines:**
- Maximum 5 items
- Always show labels
- Use badges for notifications
- Active state clearly visible

---

### Pattern 2: Tab Navigation (Trader Role)

**Use Case:** Secondary navigation for content categories

**Structure:**
```
┌─────────────────────────────────┐
│ [Tab1] [Tab2] [Tab3] [Tab4]    │
├─────────────────────────────────┤
│         Tab Content             │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
<TabNavigation
  tabs={[
    { label: 'Dashboard' },
    { label: 'Sản phẩm' },
    { label: 'Vườn trồng' },
    { label: 'Đơn hàng', badge: 5 }
  ]}
  activeIndex={activeTab}
  onChange={setActiveTab}
/>
```

**Guidelines:**
- Maximum 6 tabs
- Use badges for counts
- Scrollable on small screens
- Active tab underlined

---

### Pattern 3: 3-Click Rule Navigation

**Use Case:** Ensure critical information accessible within 3 clicks

**Example Flow:**
```
Click 1: Tap "Cảnh báo" in bottom nav
Click 2: View alert list (auto-displayed)
Click 3: Tap specific alert for details
```

**Implementation:**
```typescript
// Dashboard with immediate alert visibility
<ScreenLayout navigation={<BottomNavigation />}>
  <Card title="Cảnh báo ưu tiên cao">
    {alerts.map(alert => (
      <Alert
        key={alert.id}
        severity={alert.severity}
        message={alert.message}
        action={{
          label: "Xem chi tiết",
          onClick: () => navigateToDetail(alert.id)
        }}
      />
    ))}
  </Card>
</ScreenLayout>
```

**Guidelines:**
- Critical info visible on main screen
- Minimize navigation depth
- Use cards for quick access
- Provide direct action buttons

---

## Layout Patterns

### Pattern 4: Dashboard Layout

**Use Case:** Overview screen with key metrics and charts

**Structure:**
```
┌─────────────────────────────────┐
│          Header                 │
├─────────────────────────────────┤
│  [Metric1] [Metric2] [Metric3] │
├─────────────────────────────────┤
│         Chart Area              │
├─────────────────────────────────┤
│       Recent Items List         │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
<ScreenLayout header={<Header title="Dashboard" />}>
  {/* Metrics Grid */}
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.md 
  }}>
    <MetricCard title="Đơn hàng" value={24} />
    <MetricCard title="Vườn" value={12} />
    <MetricCard title="Doanh thu" value="50M" />
  </div>
  
  {/* Chart */}
  <Card title="Xu hướng">
    <Chart type="line" data={chartData} />
  </Card>
  
  {/* List */}
  <Card title="Gần đây">
    <ItemList items={recentItems} />
  </Card>
</ScreenLayout>
```

---

### Pattern 5: Detail View Layout

**Use Case:** Detailed information about a single item

**Structure:**
```
┌─────────────────────────────────┐
│  [Back] Title        [Action]   │
├─────────────────────────────────┤
│       Hero Image/Visual         │
├─────────────────────────────────┤
│      Main Information           │
├─────────────────────────────────┤
│     Additional Details          │
├─────────────────────────────────┤
│    [Primary Action Button]      │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
<ScreenLayout
  header={
    <Header
      title="Chi tiết sản phẩm"
      leftAction={<Icon name="arrow-left" onClick={goBack} />}
      rightAction={<Icon name="share" onClick={handleShare} />}
    />
  }
>
  <ImageSlider images={product.images} />
  
  <Card>
    <h1>{product.name}</h1>
    <p>{product.description}</p>
  </Card>
  
  <Card title="Thông tin chi tiết">
    <DetailList items={product.details} />
  </Card>
  
  <StickyFooter>
    <Button variant="primary" size="large">
      Đặt cọc ngay
    </Button>
  </StickyFooter>
</ScreenLayout>
```

---

### Pattern 6: List with Filters

**Use Case:** Browsable list with filtering options

**Structure:**
```
┌─────────────────────────────────┐
│  [Search] [Filter] [Sort]       │
├─────────────────────────────────┤
│  ┌───────────────────────┐     │
│  │     List Item 1       │     │
│  └───────────────────────┘     │
│  ┌───────────────────────┐     │
│  │     List Item 2       │     │
│  └───────────────────────┘     │
└─────────────────────────────────┘
```

**Implementation:**
```typescript
<ScreenLayout header={<Header title="Sản phẩm" />}>
  <div style={{ 
    display: 'flex', 
    gap: spacing.sm,
    padding: spacing.md 
  }}>
    <SearchInput />
    <FilterButton />
    <SortButton />
  </div>
  
  <div>
    {filteredItems.map(item => (
      <Card key={item.id} {...item} />
    ))}
  </div>
</ScreenLayout>
```

---

## Interaction Patterns

### Pattern 7: Pull to Refresh

**Use Case:** Refresh data on scroll

**Implementation:**
```typescript
const RefreshableList = () => {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };
  
  return (
    <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
      <ItemList items={items} />
    </PullToRefresh>
  );
};
```

---

### Pattern 8: Infinite Scroll

**Use Case:** Load more items as user scrolls

**Implementation:**
```typescript
const InfiniteList = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const loadMore = async () => {
    const newItems = await fetchItems(page);
    setItems([...items, ...newItems]);
    setPage(page + 1);
    setHasMore(newItems.length > 0);
  };
  
  return (
    <InfiniteScroll
      dataLength={items.length}
      next={loadMore}
      hasMore={hasMore}
    >
      {items.map(item => <Card key={item.id} {...item} />)}
    </InfiniteScroll>
  );
};
```

---

### Pattern 9: Swipe Actions

**Use Case:** Quick actions on list items

**Implementation:**
```typescript
<SwipeableListItem
  leftActions={[
    { icon: 'check', color: colors.semantic.success, onClick: handleApprove }
  ]}
  rightActions={[
    { icon: 'delete', color: colors.semantic.error, onClick: handleDelete }
  ]}
>
  <Card {...item} />
</SwipeableListItem>
```

---

## Data Display Patterns

### Pattern 10: Sensor Grid

**Use Case:** Display multiple sensor readings

**Structure:**
```
┌──────────┬──────────┐
│  Temp    │  Humid   │
│  28°C    │  75%     │
├──────────┼──────────┤
│  Light   │  pH      │
│  850 lux │  6.5     │
└──────────┴──────────┘
```

**Implementation:**
```typescript
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: spacing.md 
}}>
  {sensors.map(sensor => (
    <SensorDisplay
      key={sensor.id}
      type={sensor.type}
      value={sensor.value}
      unit={sensor.unit}
      status={sensor.status}
    />
  ))}
</div>
```

---

### Pattern 11: Status Timeline

**Use Case:** Show chronological events

**Implementation:**
```typescript
<Timeline>
  {events.map(event => (
    <TimelineItem
      key={event.id}
      icon={event.icon}
      title={event.title}
      timestamp={event.timestamp}
      status={event.status}
    >
      {event.description}
    </TimelineItem>
  ))}
</Timeline>
```

---

### Pattern 12: Comparison Table

**Use Case:** Compare multiple items side by side

**Implementation:**
```typescript
<ComparisonTable
  items={[product1, product2, product3]}
  attributes={[
    { key: 'price', label: 'Giá' },
    { key: 'quality', label: 'Chất lượng' },
    { key: 'location', label: 'Vị trí' }
  ]}
/>
```

---

## Form Patterns

### Pattern 13: Multi-Step Form

**Use Case:** Complex form broken into steps

**Implementation:**
```typescript
const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  return (
    <div>
      <ProgressBar current={step} total={4} />
      
      {step === 1 && <Step1 data={formData} onNext={handleNext} />}
      {step === 2 && <Step2 data={formData} onNext={handleNext} />}
      {step === 3 && <Step3 data={formData} onNext={handleNext} />}
      {step === 4 && <Step4 data={formData} onSubmit={handleSubmit} />}
    </div>
  );
};
```

---

### Pattern 14: Inline Validation

**Use Case:** Real-time form validation

**Implementation:**
```typescript
const ValidatedInput = ({ value, onChange, validate }) => {
  const [error, setError] = useState('');
  
  const handleChange = (newValue) => {
    onChange(newValue);
    const validation = validate(newValue);
    setError(validation.error || '');
  };
  
  return (
    <div>
      <input value={value} onChange={e => handleChange(e.target.value)} />
      {error && <span style={{ color: colors.semantic.error }}>{error}</span>}
    </div>
  );
};
```

---

## Feedback Patterns

### Pattern 15: Loading States

**Use Case:** Show loading feedback

**Variants:**

**Skeleton Loading:**
```typescript
<SkeletonCard />
<SkeletonList count={3} />
```

**Spinner Loading:**
```typescript
<div style={{ textAlign: 'center', padding: spacing.xl }}>
  <Icon name="spinner" size="lg" />
  <p>Đang tải...</p>
</div>
```

**Button Loading:**
```typescript
<Button variant="primary" loading>
  Đang xử lý...
</Button>
```

---

### Pattern 16: Empty States

**Use Case:** No data to display

**Implementation:**
```typescript
const EmptyState = ({ icon, title, message, action }) => (
  <div style={{ 
    textAlign: 'center', 
    padding: spacing.xxl 
  }}>
    <Icon name={icon} size="lg" color={colors.text.secondary} />
    <h2 style={createTypographyStyle('h2')}>{title}</h2>
    <p style={createTypographyStyle('body')}>{message}</p>
    {action && (
      <Button variant="primary" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

// Usage
<EmptyState
  icon="inbox"
  title="Chưa có đơn hàng"
  message="Bạn chưa có đơn hàng nào"
  action={{
    label: "Tạo đơn hàng",
    onClick: handleCreateOrder
  }}
/>
```

---

### Pattern 17: Success/Error Feedback

**Use Case:** Confirm action completion

**Toast Notification:**
```typescript
showToast({
  severity: 'success',
  message: 'Đã lưu thành công'
});
```

**Alert Banner:**
```typescript
<Alert
  severity="success"
  message="Đã cập nhật thông tin"
  dismissible
  onDismiss={handleDismiss}
/>
```

---

## Role-Specific Patterns

### Pattern 18: Farmer Alert Priority

**Use Case:** Show critical alerts prominently

**Implementation:**
```typescript
<Card title="Cảnh báo ưu tiên cao">
  {criticalAlerts.map(alert => (
    <Alert
      key={alert.id}
      severity="error"
      title={alert.title}
      message={alert.message}
      action={{
        label: alert.actionLabel,
        onClick: () => handleAction(alert)
      }}
    />
  ))}
</Card>

<Card title="Cảnh báo khác">
  {otherAlerts.map(alert => (
    <Alert
      key={alert.id}
      severity="warning"
      message={alert.message}
    />
  ))}
</Card>
```

---

### Pattern 19: Trader Compliance Monitoring

**Use Case:** Monitor farmer compliance with standards

**Implementation:**
```typescript
<Card title="Tuân thủ quy trình">
  <ComplianceScore score={farmer.complianceScore} />
  
  <Chart
    type="line"
    data={farmer.environmentData}
    overlays={[
      { type: 'range', min: standardMin, max: standardMax, color: colors.primary.agriGreen }
    ]}
  />
  
  {farmer.violations.map(violation => (
    <Alert
      key={violation.id}
      severity="warning"
      message={violation.description}
    />
  ))}
</Card>
```

---

### Pattern 20: Buyer Traceability View

**Use Case:** Show product origin and history

**Implementation:**
```typescript
<ScreenLayout header={<Header title="Truy xuất nguồn gốc" />}>
  {/* Farm Info */}
  <Card>
    <h2>{product.farm.name}</h2>
    <p>{product.farm.location}</p>
    <MapView location={product.farm.coordinates} />
  </Card>
  
  {/* Timeline */}
  <Card title="Lịch sử canh tác">
    <Timeline>
      {product.history.map(event => (
        <TimelineItem
          key={event.id}
          icon={event.icon}
          title={event.title}
          timestamp={event.timestamp}
        >
          {event.image && <img src={event.image} />}
          <p>{event.description}</p>
        </TimelineItem>
      ))}
    </Timeline>
  </Card>
  
  {/* Environment Charts */}
  <Card title="Dữ liệu môi trường">
    <Chart
      type="line"
      data={product.environmentHistory}
      xAxis={{ label: 'Thời gian' }}
      yAxis={{ label: 'Nhiệt độ (°C)' }}
    />
  </Card>
</ScreenLayout>
```

---

## Best Practices

### 1. Consistency

- Use the same pattern for similar use cases
- Follow established navigation patterns
- Maintain consistent spacing and layout

### 2. Accessibility

- Ensure minimum touch targets (44x44px)
- Provide clear labels and feedback
- Support keyboard navigation

### 3. Performance

- Lazy load heavy components
- Use virtualization for long lists
- Optimize images and assets

### 4. User Feedback

- Always provide loading states
- Show success/error messages
- Use appropriate severity levels

### 5. Mobile-First

- Design for small screens first
- Use responsive layouts
- Optimize for touch interactions

---

## See Also

- [API Reference](./API_REFERENCE.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
