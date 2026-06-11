-- =============================================================================
-- seed-demo-scenario.sql — Demo Scenario Seed
-- =============================================================================
-- Mục đích: Tạo dữ liệu demo end-to-end cho phiên bảo vệ đồ án.
--
-- Thứ tự chạy:
--   1. Chạy auth-service migration / TypeORM sync (tạo bảng users, v.v.)
--   2. Chạy be/scripts/seed-dev-users.sql (tạo 4 user nền)
--   3. Khởi động farm-service (StandardsSeeder tự seed VietGAP/GlobalGAP/Organic)
--   4. Chạy file này:
--        docker exec -i trustagri-postgres psql -U trustagri -d trustagri < be/scripts/seed-demo-scenario.sql
--   5. (Tuỳ chọn) Seed InfluxDB:
--        ./be/scripts/seed-influxdb.sh a1111111-0000-4000-8000-000000000001
--        Lưu ý: ~10-15% điểm nên có is_imputed=true để test NFR-A01.
--   6. FLUSHALL Redis nếu cần reset cache:
--        docker exec trustagri-redis redis-cli FLUSHALL
--
-- Main farm UUID cho seed-influxdb.sh:
--   FARM_MAIN_UUID = a1111111-0000-4000-8000-000000000001
--
-- Idempotent: mọi INSERT dùng ON CONFLICT (id) DO NOTHING hoặc ON CONFLICT (id) DO UPDATE.
-- Re-runnable — an toàn nếu chạy lại.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Constants (dùng trong toàn script qua subquery / hardcode UUID)
-- ---------------------------------------------------------------------------
-- farmer  : a0000001-0000-4000-8000-000000000001
-- trader  : a0000001-0000-4000-8000-000000000002
-- buyer   : a0000001-0000-4000-8000-000000000003
-- guest   : a0000001-0000-4000-8000-000000000004
-- mock_farmer2 không tồn tại trong users — bỏ qua pending connection (xem mục 4)
--
-- Farm main UUID = a1111111-0000-4000-8000-000000000001 (cần cho seed-influxdb.sh)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Cập nhật tên + avatar người dùng đẹp hơn cho demo
-- ---------------------------------------------------------------------------
UPDATE users SET
  display_name = N'Nông hộ Sáu Xoài – Cái Bè',
  avatar_url   = 'https://picsum.photos/seed/farmer_demo/64/64',
  farmer_profile = '{"region":"Tiền Giang","experienceYears":15}'::jsonb
WHERE user_id = 'a0000001-0000-4000-8000-000000000001'::uuid;

UPDATE users SET
  display_name   = N'Vựa trái cây Minh Phát',
  avatar_url     = 'https://picsum.photos/seed/trader_demo/64/64',
  trader_profile = '{"companyName":"Cty TNHH XNK Minh Phát","region":"Cần Thơ","capacity":"800 tấn/tháng","trustScore":4.8}'::jsonb
WHERE user_id = 'a0000001-0000-4000-8000-000000000002'::uuid;

UPDATE users SET
  display_name  = N'Chuỗi Xanh Plus',
  avatar_url    = 'https://picsum.photos/seed/buyer_demo/64/64',
  buyer_profile = '{"organizationName":"Chuỗi siêu thị Xanh Plus – 50 chi nhánh"}'::jsonb
WHERE user_id = 'a0000001-0000-4000-8000-000000000003'::uuid;

UPDATE users SET
  display_name = N'Khách tham quan',
  avatar_url   = 'https://picsum.photos/seed/guest_demo/64/64'
WHERE user_id = 'a0000001-0000-4000-8000-000000000004'::uuid;

-- ---------------------------------------------------------------------------
-- 2. Farms (2 vườn cho farmer)
-- ---------------------------------------------------------------------------

-- farm_main: Vườn xoài cát Hòa Lộc — vườn demo chính
-- current_contract_id được SET sau khi contract được INSERT (xem dưới phần 5)
INSERT INTO farms (
  id, owner_id, owner_display_name, owner_phone,
  name, location, area, crop_type,
  standard_id, planting_date, traceability_code,
  current_contract_id,
  created_at, updated_at
) VALUES (
  'a1111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè',
  '0901234567',
  N'Vườn xoài cát Hòa Lộc',
  '{"province":"Tiền Giang","district":"Cái Bè","addressLine":"Ấp 4, xã Hòa Hưng, Cái Bè","lat":10.4028,"lng":105.9432}'::jsonb,
  2.5,
  'mango',
  (SELECT id FROM standards WHERE code = 'VIETGAP_2024' LIMIT 1),
  '2025-01-15',
  'TR-DEMO-MAIN-001',
  NULL,  -- will be updated to c1111111-...-001 after contract insert (section 5b)
  NOW() - INTERVAL '5 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  owner_display_name = EXCLUDED.owner_display_name,
  name               = EXCLUDED.name,
  traceability_code  = EXCLUDED.traceability_code,
  updated_at         = NOW();

-- farm_secondary: Vườn sầu riêng phụ
INSERT INTO farms (
  id, owner_id, owner_display_name, owner_phone,
  name, location, area, crop_type,
  standard_id, planting_date, traceability_code,
  current_contract_id,
  created_at, updated_at
) VALUES (
  'a1111111-0000-4000-8000-000000000002'::uuid,
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè',
  '0901234567',
  N'Vườn sầu riêng Monthong',
  '{"province":"Tiền Giang","district":"Cái Bè","addressLine":"Ấp 2, xã Mỹ Đức Đông, Cái Bè","lat":10.3890,"lng":105.9510}'::jsonb,
  1.8,
  'durian',
  (SELECT id FROM standards WHERE code = 'GLOBALGAP_2024' LIMIT 1),
  '2024-09-01',
  'TR-DEMO-SEC-002',
  NULL,
  NOW() - INTERVAL '9 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 3. Connection farmer ↔ trader, trạng thái 'accepted' (đã ký kết)
-- ---------------------------------------------------------------------------
INSERT INTO connections (
  id, from_user_id, to_user_id,
  from_role, to_role,
  farm_id,
  from_user_name, from_user_phone,
  to_user_name, to_user_phone,
  farm_name,
  message,
  status,
  created_at, responded_at
) VALUES (
  'b1111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000001',  -- farmer
  'a0000001-0000-4000-8000-000000000002',  -- trader
  'farmer', 'trader',
  'a1111111-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  N'Vựa trái cây Minh Phát', '0912345678',
  N'Vườn xoài cát Hòa Lộc',
  N'Mong muốn hợp tác xuất khẩu xoài cát Hòa Lộc tiêu chuẩn VietGAP 2024',
  'accepted',
  NOW() - INTERVAL '4 months',
  NOW() - INTERVAL '4 months' + INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Connection pending (mock farmer2 → trader) để demo Accept trực tiếp
--    farmer2 không có user thật → dùng buyer user_id tạm thời làm "người gửi"
--    để tránh FK violation. Thực tế demo: trader nhìn thấy incoming request.
-- ---------------------------------------------------------------------------
INSERT INTO connections (
  id, from_user_id, to_user_id,
  from_role, to_role,
  farm_id,
  from_user_name, from_user_phone,
  to_user_name, to_user_phone,
  farm_name,
  message,
  status,
  created_at, responded_at
) VALUES (
  'b1111111-0000-4000-8000-000000000002'::uuid,
  'a0000001-0000-4000-8000-000000000004',  -- dùng guest user làm "farmer mới"
  'a0000001-0000-4000-8000-000000000002',  -- trader
  'farmer', 'trader',
  NULL,
  N'Nông hộ Bảy Lúa – Châu Thành', '0907654321',
  N'Vựa trái cây Minh Phát', '0912345678',
  NULL,
  N'Muốn kết nối hợp tác thu mua bưởi da xanh và xoài',
  'pending',
  NOW() - INTERVAL '2 days',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Hợp đồng farmer–trader (farmer_trader), trạng thái 'active', VietGAP 2024
-- ---------------------------------------------------------------------------
INSERT INTO contracts (
  id,
  party_farmer_id, party_trader_id, party_buyer_id,
  contract_type,
  product_id, standard_id, standard_name, farm_id,
  party_farmer_name, party_farmer_phone,
  party_trader_name, party_trader_phone,
  party_buyer_name, party_buyer_phone,
  farm_name,
  quantity, unit,
  total_price, deposit,
  start_date, end_date, planting_date,
  status, terms,
  order_id, proposal_id, source_contract_id,
  traceability_code,
  farmer_signed_at, trader_signed_at, buyer_signed_at,
  created_at, updated_at
) VALUES (
  'c1111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000001',  -- farmer
  'a0000001-0000-4000-8000-000000000002',  -- trader
  NULL,
  'farmer_trader',
  NULL,
  (SELECT id FROM standards WHERE code = 'VIETGAP_2024' LIMIT 1),
  'VietGAP 2024',
  'a1111111-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  N'Vựa trái cây Minh Phát', '0912345678',
  NULL, NULL,
  N'Vườn xoài cát Hòa Lộc',
  15.000, 'tấn',
  420000000.00, 84000000.00,
  '2025-01-20', '2025-08-31', '2025-01-15',
  'active',
  N'Hợp đồng canh tác xoài cát Hòa Lộc theo tiêu chuẩn VietGAP 2024. Bên mua cam kết thu mua toàn bộ sản lượng đạt chuẩn.',
  NULL, NULL, NULL,
  'LOT-DEMO-MAIN-0001',
  NOW() - INTERVAL '4 months',
  NOW() - INTERVAL '4 months',
  NULL,
  NOW() - INTERVAL '4 months',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status        = EXCLUDED.status,
  updated_at    = NOW();

-- ---------------------------------------------------------------------------
-- 5b. Cập nhật current_contract_id cho farm chính (sau khi contract đã tồn tại)
-- ---------------------------------------------------------------------------
UPDATE farms
SET current_contract_id = 'c1111111-0000-4000-8000-000000000001'::uuid,
    updated_at = NOW()
WHERE id = 'a1111111-0000-4000-8000-000000000001'::uuid;

-- ---------------------------------------------------------------------------
-- 6. Care Logs — 8 bản ghi trải 7 ngày (maps VietGAP steps 1-8, ~80% compliance)
--    VietGAP steps: 1=chuẩn bị đất, 2=bón phân lót, 3=gieo hạt, 4=tưới nước,
--                   5=bón phân thúc, 6=IPM, 7=thu hoạch, 8=xử lý sau thu hoạch
--    Để ~80% compliance: seed 6/8 bước có care log, bỏ bước 7 và 8 (chưa đến hạn thu hoạch).
-- ---------------------------------------------------------------------------

-- Bước 1: Chuẩn bị và cải tạo đất (6 ngày trước)
INSERT INTO care_logs (
  id, farm_id, standard_step_id, action, notes,
  performed_at, deviation, sync_status, client_record_id,
  performed_by, performed_by_name, performed_by_phone,
  contract_id, created_at, updated_at
) VALUES (
  'd1111111-0000-4000-8000-000000000001'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  (SELECT id FROM standard_steps ss JOIN standards s ON ss.standard_id = s.id WHERE s.code = 'VIETGAP_2024' AND ss."order" = 1 LIMIT 1),
  'process_step_complete',
  N'Đã phân tích đất, pH=6.2, bổ sung vôi 200kg/ha. Kết quả đạt yêu cầu.',
  NOW() - INTERVAL '6 days',
  false, 'synced', 'demo-cl-001',
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

-- Bước 2: Bón phân lót (5 ngày trước)
INSERT INTO care_logs (
  id, farm_id, standard_step_id, action, notes,
  performed_at, deviation, sync_status, client_record_id,
  performed_by, performed_by_name, performed_by_phone,
  contract_id, created_at, updated_at
) VALUES (
  'd1111111-0000-4000-8000-000000000002'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  (SELECT id FROM standard_steps ss JOIN standards s ON ss.standard_id = s.id WHERE s.code = 'VIETGAP_2024' AND ss."order" = 2 LIMIT 1),
  'process_step_complete',
  N'Bón 500kg phân hữu cơ ủ hoai + 100kg NPK 16-16-8 theo khuyến cáo.',
  NOW() - INTERVAL '5 days',
  false, 'synced', 'demo-cl-002',
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

-- Bước 3: Gieo hạt / Trồng cây con (5 ngày trước)
INSERT INTO care_logs (
  id, farm_id, standard_step_id, action, notes,
  performed_at, deviation, sync_status, client_record_id,
  performed_by, performed_by_name, performed_by_phone,
  contract_id, created_at, updated_at
) VALUES (
  'd1111111-0000-4000-8000-000000000003'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  (SELECT id FROM standard_steps ss JOIN standards s ON ss.standard_id = s.id WHERE s.code = 'VIETGAP_2024' AND ss."order" = 3 LIMIT 1),
  'process_step_complete',
  N'Trồng 850 cây xoài cát giống kiểm định, mật độ 4x4m. Tỉ lệ bén rễ sau 7 ngày đạt 92%.',
  NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
  false, 'synced', 'demo-cl-003',
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

-- Bước 4: Tưới nước và quản lý độ ẩm (4 ngày trước)
INSERT INTO care_logs (
  id, farm_id, standard_step_id, action, notes,
  performed_at, deviation, sync_status, client_record_id,
  performed_by, performed_by_name, performed_by_phone,
  contract_id, created_at, updated_at
) VALUES (
  'd1111111-0000-4000-8000-000000000004'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  (SELECT id FROM standard_steps ss JOIN standards s ON ss.standard_id = s.id WHERE s.code = 'VIETGAP_2024' AND ss."order" = 4 LIMIT 1),
  'process_step_complete',
  N'Hệ thống tưới nhỏ giọt hoạt động tốt. Độ ẩm đất duy trì 68-72%. Kiểm tra sensor mỗi sáng.',
  NOW() - INTERVAL '4 days',
  false, 'synced', 'demo-cl-004',
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

-- Bước 5: Bón phân thúc (3 ngày trước)
INSERT INTO care_logs (
  id, farm_id, standard_step_id, action, notes,
  performed_at, deviation, sync_status, client_record_id,
  performed_by, performed_by_name, performed_by_phone,
  contract_id, created_at, updated_at
) VALUES (
  'd1111111-0000-4000-8000-000000000005'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  (SELECT id FROM standard_steps ss JOIN standards s ON ss.standard_id = s.id WHERE s.code = 'VIETGAP_2024' AND ss."order" = 5 LIMIT 1),
  'process_step_complete',
  N'Bón phân thúc giai đoạn ra hoa: Kali 200kg/ha + Bo vi lượng 30g/cây. Ghi chép đầy đủ.',
  NOW() - INTERVAL '3 days',
  false, 'synced', 'demo-cl-005',
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Bước 6: IPM — Phòng trừ sâu bệnh (2 ngày trước, có deviation nhỏ)
INSERT INTO care_logs (
  id, farm_id, standard_step_id, action, notes,
  performed_at, deviation, sync_status, client_record_id,
  performed_by, performed_by_name, performed_by_phone,
  contract_id, created_at, updated_at
) VALUES (
  'd1111111-0000-4000-8000-000000000006'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  (SELECT id FROM standard_steps ss JOIN standards s ON ss.standard_id = s.id WHERE s.code = 'VIETGAP_2024' AND ss."order" = 6 LIMIT 1),
  'process_step_complete',
  N'Phun thuốc Abamectin 3.6EC (trong danh mục) phòng nhện đỏ. Ghi nhận xuất hiện sớm hơn dự kiến — đã ghi deviation.',
  NOW() - INTERVAL '2 days',
  true, 'synced', 'demo-cl-006',
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Bước 7: Thu hoạch — CHƯA thực hiện (tạo ~80% compliance, thiếu 2 bước cuối)
-- Bước 8: Xử lý sau thu hoạch — CHƯA thực hiện

-- ---------------------------------------------------------------------------
-- 6b. Evidence rows (2 ảnh minh chứng)
-- ---------------------------------------------------------------------------
INSERT INTO evidences (id, care_log_id, file_url, mime_type, captured_at, created_at)
VALUES (
  'e1111111-0000-4000-8000-000000000001'::uuid,
  'd1111111-0000-4000-8000-000000000004'::uuid,
  'https://picsum.photos/seed/evidence_water/480/320',
  'image/jpeg',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO evidences (id, care_log_id, file_url, mime_type, captured_at, created_at)
VALUES (
  'e1111111-0000-4000-8000-000000000002'::uuid,
  'd1111111-0000-4000-8000-000000000006'::uuid,
  'https://picsum.photos/seed/evidence_pest/480/320',
  'image/jpeg',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. IoT Alerts (2 alerts cho vườn chính)
-- ---------------------------------------------------------------------------
INSERT INTO alerts (
  id, farm_id, farm_name,
  sensor_type, severity, threshold, value,
  suggested_action,
  acknowledged, acknowledged_by, acknowledged_by_name, acknowledged_by_phone,
  acknowledged_at, created_at
) VALUES (
  'f1111111-0000-4000-8000-000000000001'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  N'Vườn xoài cát Hòa Lộc',
  'soil_moisture', 'warning', 30.0, 27.5,
  N'Kiểm tra hệ thống tưới nhỏ giọt, tăng lịch tưới thêm 15 phút/ngày.',
  true,
  'a0000001-0000-4000-8000-000000000001',
  N'Nông hộ Sáu Xoài – Cái Bè', '0901234567',
  NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO alerts (
  id, farm_id, farm_name,
  sensor_type, severity, threshold, value,
  suggested_action,
  acknowledged, acknowledged_by, acknowledged_by_name, acknowledged_by_phone,
  acknowledged_at, created_at
) VALUES (
  'f1111111-0000-4000-8000-000000000002'::uuid,
  'a1111111-0000-4000-8000-000000000001',
  N'Vườn xoài cát Hòa Lộc',
  'temperature', 'warning', 35.0, 36.8,
  N'Bật hệ thống phun sương làm mát. Kiểm tra độ ẩm vào buổi sáng sớm.',
  false,
  NULL, NULL, NULL, NULL,
  NOW() - INTERVAL '6 hours'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Products của trader (3 sản phẩm)
-- ---------------------------------------------------------------------------
INSERT INTO products (
  id, trader_id, farm_id,
  trader_display_name, trader_phone, farm_name,
  source_contract_id, standard_id, standard_name,
  name, crop_type, unit, price, currency,
  images, standard_code, stock_quantity, description,
  status, created_at
) VALUES (
  'p1111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  'a1111111-0000-4000-8000-000000000001',
  N'Vựa trái cây Minh Phát', '0912345678',
  N'Vườn xoài cát Hòa Lộc',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  (SELECT id FROM standards WHERE code = 'VIETGAP_2024' LIMIT 1),
  'VietGAP 2024',
  N'Xoài cát Hòa Lộc VietGAP',
  'mango', 'kg', 55000.00, 'VND',
  '["https://picsum.photos/seed/mango_hoa_loc/400/300"]'::jsonb,
  'VIETGAP_2024', 5000,
  N'Xoài cát Hòa Lộc đặc sản Tiền Giang, canh tác theo tiêu chuẩn VietGAP 2024. Trái to, thịt dày, ngọt lịm. Truy xuất nguồn gốc đầy đủ.',
  'active', NOW() - INTERVAL '3 months'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO products (
  id, trader_id, farm_id,
  trader_display_name, trader_phone, farm_name,
  source_contract_id, standard_id, standard_name,
  name, crop_type, unit, price, currency,
  images, standard_code, stock_quantity, description,
  status, created_at
) VALUES (
  'p1111111-0000-4000-8000-000000000002'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  NULL,
  N'Vựa trái cây Minh Phát', '0912345678',
  NULL,
  NULL, NULL, NULL,
  N'Sầu riêng Monthong Ri6',
  'durian', 'kg', 180000.00, 'VND',
  '["https://picsum.photos/seed/durian_ri6/400/300"]'::jsonb,
  NULL, 2000,
  N'Sầu riêng Monthong Ri6 Cái Bè. Cơm vàng óng, hạt lép, hương thơm đặc trưng. Hàng đặt trước mùa vụ.',
  'active', NOW() - INTERVAL '2 months'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO products (
  id, trader_id, farm_id,
  trader_display_name, trader_phone, farm_name,
  source_contract_id, standard_id, standard_name,
  name, crop_type, unit, price, currency,
  images, standard_code, stock_quantity, description,
  status, created_at
) VALUES (
  'p1111111-0000-4000-8000-000000000003'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  NULL,
  N'Vựa trái cây Minh Phát', '0912345678',
  NULL,
  NULL, NULL, NULL,
  N'Bưởi da xanh Bến Tre',
  'pomelo', 'quả', 28000.00, 'VND',
  '["https://picsum.photos/seed/pomelo_bentre/400/300"]'::jsonb,
  NULL, 8000,
  N'Bưởi da xanh Bến Tre chính hiệu. Múi dày, nhiều nước, vị ngọt thanh. Xuất khẩu sang Nhật và Hàn Quốc.',
  'active', NOW() - INTERVAL '1 month'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Buying Request từ buyer (mua xoài)
-- ---------------------------------------------------------------------------
INSERT INTO buying_requests (
  id, buyer_id, buyer_display_name, buyer_phone,
  crop_type, quantity, unit,
  quality_standard_code, expected_price, deposit_offered,
  delivery_date, description, status,
  created_at, updated_at
) VALUES (
  'br111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000003',
  N'Chuỗi siêu thị Xanh Plus', '0934567890',
  'mango', 500.000, 'kg',
  'VIETGAP_2024', 50000.00, 5000000.00,
  (NOW() + INTERVAL '30 days')::date,
  N'Cần mua 500kg xoài cát Hòa Lộc đạt chuẩn VietGAP, trái ≥350g, độ Brix ≥14. Giao hàng tại kho TP.HCM.',
  'open',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

-- Proposal từ trader phản hồi buying request (status pending — để demo Accept live)
INSERT INTO proposals (
  id, buying_request_id, trader_id, farm_id,
  trader_display_name, trader_phone, farm_name,
  source_contract_id, standard_id, standard_name,
  price, quantity, standard_code, note,
  status, created_at
) VALUES (
  'pr111111-0000-4000-8000-000000000001'::uuid,
  'br111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  'a1111111-0000-4000-8000-000000000001',
  N'Vựa trái cây Minh Phát', '0912345678',
  N'Vườn xoài cát Hòa Lộc',
  'c1111111-0000-4000-8000-000000000001'::uuid,
  (SELECT id FROM standards WHERE code = 'VIETGAP_2024' LIMIT 1),
  'VietGAP 2024',
  52000.00, 500.000, 'VIETGAP_2024',
  N'Cam kết giao hàng đúng hạn, đạt chuẩn VietGAP 2024 với truy xuất nguồn gốc đầy đủ. Có thể cung cấp certificate.',
  'pending',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. Order accepted → Buyer–Trader contract (trader_buyer) để Buyer Live Monitor
-- ---------------------------------------------------------------------------

-- Order đã được accepted (contracted)
INSERT INTO orders (
  id, buyer_id, trader_id,
  buyer_display_name, buyer_phone,
  trader_display_name, trader_phone,
  product_id, quantity, unit,
  total_price, deposit, status,
  created_at, updated_at
) VALUES (
  'or111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000002',
  N'Chuỗi siêu thị Xanh Plus', '0934567890',
  N'Vựa trái cây Minh Phát', '0912345678',
  'p1111111-0000-4000-8000-000000000001'::uuid,
  1000.000, 'kg',
  55000000.00, 11000000.00,
  'contracted',
  NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days'
) ON CONFLICT (id) DO NOTHING;

-- Hợp đồng trader_buyer tương ứng (active — Buyer Live Monitor cần contract này)
INSERT INTO contracts (
  id,
  party_farmer_id, party_trader_id, party_buyer_id,
  contract_type,
  product_id, standard_id, standard_name, farm_id,
  party_farmer_name, party_farmer_phone,
  party_trader_name, party_trader_phone,
  party_buyer_name, party_buyer_phone,
  farm_name,
  quantity, unit,
  total_price, deposit,
  start_date, end_date, planting_date,
  status, terms,
  order_id, proposal_id, source_contract_id,
  traceability_code,
  farmer_signed_at, trader_signed_at, buyer_signed_at,
  created_at, updated_at
) VALUES (
  'c1111111-0000-4000-8000-000000000002'::uuid,
  NULL,
  'a0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000003',
  'trader_buyer',
  'p1111111-0000-4000-8000-000000000001'::uuid,
  (SELECT id FROM standards WHERE code = 'VIETGAP_2024' LIMIT 1),
  'VietGAP 2024',
  'a1111111-0000-4000-8000-000000000001',
  NULL, NULL,
  N'Vựa trái cây Minh Phát', '0912345678',
  N'Chuỗi siêu thị Xanh Plus', '0934567890',
  N'Vườn xoài cát Hòa Lộc',
  1000.000, 'kg',
  55000000.00, 11000000.00,
  (NOW() - INTERVAL '25 days')::date,
  (NOW() + INTERVAL '35 days')::date,
  NULL,
  'active',
  N'Hợp đồng mua xoài cát Hòa Lộc VietGAP 2024 cung cấp cho chuỗi Xanh Plus. Giao hàng tại kho TP.HCM.',
  'or111111-0000-4000-8000-000000000001'::uuid,
  NULL,
  'c1111111-0000-4000-8000-000000000001'::uuid,
  NULL,
  NULL,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 11. News + Price Forecasts (2 tin tức, 7 ngày giá xoài + sầu riêng)
-- ---------------------------------------------------------------------------

-- News article 1
INSERT INTO news_articles (
  id, trader_id, trader_display_name, trader_phone,
  title, summary, content, category, image_url,
  published_at, created_at, updated_at
) VALUES (
  'na111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  N'Vựa trái cây Minh Phát', '0912345678',
  N'Xoài cát Hòa Lộc VietGAP chinh phục thị trường Nhật Bản',
  N'Lần đầu tiên xoài cát Hòa Lộc đạt chuẩn VietGAP 2024 được xuất khẩu chính ngạch sang Nhật Bản sau nhiều năm đàm phán.',
  N'Ngày 05/06/2026, lô xoài cát Hòa Lộc đầu tiên đạt chuẩn VietGAP 2024 đã được xuất khẩu chính ngạch sang thị trường Nhật Bản. Đây là kết quả của sự nỗ lực cải tiến quy trình canh tác theo tiêu chuẩn quốc tế của nông hộ tại Tiền Giang. Giá xuất khẩu đạt 85.000 VNĐ/kg CIF, cao gấp 1.5 lần giá nội địa. Dự kiến mỗi tháng xuất khẩu 20 tấn.',
  'market',
  'https://picsum.photos/seed/mango_export/600/400',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

-- News article 2
INSERT INTO news_articles (
  id, trader_id, trader_display_name, trader_phone,
  title, summary, content, category, image_url,
  published_at, created_at, updated_at
) VALUES (
  'na111111-0000-4000-8000-000000000002'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  N'Vựa trái cây Minh Phát', '0912345678',
  N'Giá sầu riêng Monthong tăng mạnh trước vụ thu hoạch chính',
  N'Sầu riêng Monthong Ri6 tăng 15% trong tháng 6/2026 do nhu cầu từ thị trường Trung Quốc tăng cao.',
  N'Theo số liệu từ Sàn giao dịch nông sản Cần Thơ, giá sầu riêng Monthong Ri6 tại vườn đang ở mức 165.000–180.000 VNĐ/kg, tăng 15% so với cùng kỳ năm ngoái. Nguyên nhân chủ yếu do nhu cầu nhập khẩu từ Trung Quốc tăng cao sau dịp Tết Đoan Ngọ. Dự báo giá tiếp tục ổn định đến hết tháng 7/2026.',
  'price',
  'https://picsum.photos/seed/durian_price/600/400',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Price forecast: xoài 7 ngày — forecastData dùng schema ForecastPayloadDto
-- (series[] với key "day"=nhãn ngày, "price"=giá VND/kg; trend, changePercent, productLabel)
INSERT INTO forecasts (
  id, trader_id, trader_display_name, trader_phone,
  region, crop_type, type,
  forecast_data,
  valid_from, valid_to,
  created_at, updated_at
) VALUES (
  'fc111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  N'Vựa trái cây Minh Phát', '0912345678',
  'Tiền Giang', 'mango', 'price',
  '{
    "productLabel": "Xoài cát Hòa Lộc VietGAP",
    "trend": "up",
    "changePercent": 7.7,
    "priceMin": 50000,
    "priceMax": 58000,
    "series": [
      {"day":"T4 11/6","price":52000},
      {"day":"T5 12/6","price":53000},
      {"day":"T6 13/6","price":53500},
      {"day":"T7 14/6","price":54000},
      {"day":"CN 15/6","price":55000},
      {"day":"T2 16/6","price":55000},
      {"day":"T3 17/6","price":56000}
    ]
  }'::jsonb,
  NOW()::date::timestamptz,
  (NOW() + INTERVAL '7 days')::date::timestamptz,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  forecast_data = EXCLUDED.forecast_data,
  valid_from    = EXCLUDED.valid_from,
  valid_to      = EXCLUDED.valid_to,
  updated_at    = NOW();

-- Price forecast: sầu riêng 7 ngày
INSERT INTO forecasts (
  id, trader_id, trader_display_name, trader_phone,
  region, crop_type, type,
  forecast_data,
  valid_from, valid_to,
  created_at, updated_at
) VALUES (
  'fc111111-0000-4000-8000-000000000002'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  N'Vựa trái cây Minh Phát', '0912345678',
  'Tiền Giang', 'durian', 'price',
  '{
    "productLabel": "Sầu riêng Monthong Ri6",
    "trend": "up",
    "changePercent": 7.1,
    "priceMin": 165000,
    "priceMax": 185000,
    "series": [
      {"day":"T4 11/6","price":170000},
      {"day":"T5 12/6","price":172000},
      {"day":"T6 13/6","price":175000},
      {"day":"T7 14/6","price":175000},
      {"day":"CN 15/6","price":178000},
      {"day":"T2 16/6","price":180000},
      {"day":"T3 17/6","price":182000}
    ]
  }'::jsonb,
  NOW()::date::timestamptz,
  (NOW() + INTERVAL '7 days')::date::timestamptz,
  NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  forecast_data = EXCLUDED.forecast_data,
  valid_from    = EXCLUDED.valid_from,
  valid_to      = EXCLUDED.valid_to,
  updated_at    = NOW();

-- ---------------------------------------------------------------------------
-- 12. Trader Review (4.8 sao, từ buyer)
-- ---------------------------------------------------------------------------
INSERT INTO trader_reviews (
  id, trader_id, buyer_id,
  trader_display_name, trader_phone,
  buyer_display_name, buyer_phone,
  order_id, rating, comment,
  created_at, updated_at
) VALUES (
  'rv111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000003',
  N'Vựa trái cây Minh Phát', '0912345678',
  N'Chuỗi siêu thị Xanh Plus', '0934567890',
  'or111111-0000-4000-8000-000000000001'::uuid,
  5,
  N'Hàng đúng chuẩn VietGAP, truy xuất nguồn gốc rõ ràng. Giao hàng đúng hạn. Rất hài lòng, sẽ hợp tác dài hạn.',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
-- Conflict on PK(id) OR unique (buyer_id, order_id) — update is safe
) ON CONFLICT (id) DO UPDATE SET
  rating     = EXCLUDED.rating,
  comment    = EXCLUDED.comment,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 13. Notifications (3-4 thông báo mỗi role)
-- ---------------------------------------------------------------------------

-- Thông báo cho farmer
INSERT INTO notifications (id, user_id, type, title, body, severity, link_to, read, read_at, created_at)
VALUES
(
  'nt111111-0000-4000-8000-000000000001'::uuid,
  'a0000001-0000-4000-8000-000000000001',
  'alert', N'Cảnh báo nhiệt độ cao',
  N'Nhiệt độ tại vườn xoài Hòa Lộc vượt ngưỡng 35°C (36.8°C). Hãy bật hệ thống làm mát.',
  'warning', '/alerts', false, NULL, NOW() - INTERVAL '6 hours'
),
(
  'nt111111-0000-4000-8000-000000000002'::uuid,
  'a0000001-0000-4000-8000-000000000001',
  'contract', N'Hợp đồng đã được ký',
  N'Hợp đồng farmer–trader với Minh Phát đã có hiệu lực từ hôm nay. Vui lòng bắt đầu ghi nhật ký chăm sóc.',
  'info', '/contracts', true, NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months'
),
(
  'nt111111-0000-4000-8000-000000000003'::uuid,
  'a0000001-0000-4000-8000-000000000001',
  'process', N'Nhắc nhở: Bước thu hoạch sắp đến hạn',
  N'Bước 7 - Thu hoạch trong kế hoạch VietGAP sẽ đến hạn trong 14 ngày. Chuẩn bị dụng cụ và nhân lực.',
  'info', '/care-plan', false, NULL, NOW() - INTERVAL '1 day'
),
(
  'nt111111-0000-4000-8000-000000000004'::uuid,
  'a0000001-0000-4000-8000-000000000001',
  'connection', N'Kết nối với Minh Phát được chấp nhận',
  N'Thương lái Minh Phát đã chấp nhận yêu cầu kết nối của bạn. Bạn có thể bắt đầu thương lượng hợp đồng.',
  'info', '/connections', true, NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months'
)
ON CONFLICT (id) DO NOTHING;

-- Thông báo cho trader
INSERT INTO notifications (id, user_id, type, title, body, severity, link_to, read, read_at, created_at)
VALUES
(
  'nt111111-0000-4000-8000-000000000005'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  'connection', N'Yêu cầu kết nối mới',
  N'Nông hộ "Bảy Lúa – Châu Thành" muốn kết nối hợp tác. Xem và phản hồi ngay.',
  'info', '/connections', false, NULL, NOW() - INTERVAL '2 days'
),
(
  'nt111111-0000-4000-8000-000000000006'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  'contract', N'Buying request mới từ Xanh Plus',
  N'Chuỗi Xanh Plus đăng yêu cầu mua 500kg xoài cát VietGAP. Hãy gửi proposal ngay.',
  'info', '/buying-requests', false, NULL, NOW() - INTERVAL '5 days'
),
(
  'nt111111-0000-4000-8000-000000000007'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  'alert', N'Cảnh báo cảm biến vườn Hòa Lộc',
  N'Cảnh báo nhiệt độ cao (36.8°C) tại vườn xoài Hòa Lộc. Đã thông báo nông dân.',
  'warning', '/farms/a1111111-0000-4000-8000-000000000001/monitoring', false, NULL, NOW() - INTERVAL '6 hours'
),
(
  'nt111111-0000-4000-8000-000000000008'::uuid,
  'a0000001-0000-4000-8000-000000000002',
  'contract', N'Đánh giá 5 sao từ Xanh Plus',
  N'Chuỗi siêu thị Xanh Plus vừa đánh giá 5 sao cho đơn hàng xoài. Điểm uy tín của bạn đã được cập nhật.',
  'info', '/reviews', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'
)
ON CONFLICT (id) DO NOTHING;

-- Thông báo cho buyer
INSERT INTO notifications (id, user_id, type, title, body, severity, link_to, read, read_at, created_at)
VALUES
(
  'nt111111-0000-4000-8000-000000000009'::uuid,
  'a0000001-0000-4000-8000-000000000003',
  'contract', N'Proposal từ Minh Phát',
  N'Thương lái Minh Phát đã gửi proposal cho yêu cầu mua xoài VietGAP của bạn. Xem ngay.',
  'info', '/proposals', false, NULL, NOW() - INTERVAL '3 days'
),
(
  'nt111111-0000-4000-8000-000000000010'::uuid,
  'a0000001-0000-4000-8000-000000000003',
  'contract', N'Hợp đồng đang có hiệu lực',
  N'Hợp đồng mua xoài cát với Minh Phát đang có hiệu lực. Theo dõi tiến độ canh tác trực tiếp.',
  'info', '/contracts', true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'
),
(
  'nt111111-0000-4000-8000-000000000011'::uuid,
  'a0000001-0000-4000-8000-000000000003',
  'system', N'Chào mừng đến TrustAgri',
  N'Bạn đã đăng ký thành công tài khoản người mua trên TrustAgri. Khám phá sản phẩm nông sản sạch ngay!',
  'info', '/marketplace', true, NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Kết thúc
-- ---------------------------------------------------------------------------
COMMIT;

-- =============================================================================
-- OPERATOR NOTES
-- =============================================================================
-- 1) Sau khi chạy script này, seed InfluxDB sensor data:
--      ./be/scripts/seed-influxdb.sh a1111111-0000-4000-8000-000000000001
--    Đảm bảo ~10-15% points có is_imputed=true (test NFR-A01).
--
-- 2) Compliance screen (FR-T02) sẽ hiển thị ~75% (6/8 bước VietGAP đã hoàn thành,
--    bước 7-Thu hoạch và 8-Xử lý sau thu hoạch chưa thực hiện).
--
-- 3) Alert chưa ack (id=f1111111-...-000000000002, nhiệt độ 36.8°C) → dùng để demo
--    acknowledge flow live.
--
-- 4) Connection pending (id=b1111111-...-000000000002) → trader demo Accept flow live.
--
-- 5) Proposal pending (id=pr111111-...-000000000001) → buyer demo Accept flow live.
--
-- 6) Trader review score = 5 sao → trust score hiển thị trên TraderLibraryScreen.
-- =============================================================================
