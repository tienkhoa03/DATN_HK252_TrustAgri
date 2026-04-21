-- Seed users for local/dev — UUID và zalo_id khớp `fe/src/services/mocks/mockAuthService.ts` (MOCK_USER_IDS / MOCK_ZALO_IDS).
-- Sau seed có thể lấy JWT thật: POST /api/v1/auth/dev-login (AUTH_DEV_LOGIN_ENABLED, DEV_LOGIN_SECRET, localhost).
-- Chạy sau khi auth-service đã tạo bảng `users` (TypeORM synchronize hoặc migration).
--
--   docker exec -i trustagri-postgres psql -U trustagri -d trustagri < be/scripts/seed-dev-users.sql
--   hoặc: psql -h localhost -U trustagri -d trustagri -f be/scripts/seed-dev-users.sql
--
-- Ghi chú: kiểu enum có thể là `users_role_enum` (TypeORM mặc định). Nếu lỗi cast, đổi thành
--   role = v.role::text::users_role_enum
-- hoặc bỏ ::users_role_enum nếu cột là varchar.

BEGIN;

INSERT INTO users (
  user_id,
  zalo_id,
  role,
  display_name,
  phone,
  email,
  avatar_url,
  trader_profile,
  farmer_profile,
  buyer_profile,
  created_at,
  last_login
) VALUES
(
  'a0000001-0000-4000-8000-000000000001'::uuid,
  'zalo_dev_farmer_001',
  'farmer',
  N'Nguyễn Văn An',
  '0901234567',
  NULL,
  'https://picsum.photos/seed/farmer001/64/64',
  NULL,
  '{"region":"Tiền Giang","experienceYears":8}'::jsonb,
  NULL,
  '2024-01-15T07:00:00.000Z'::timestamptz,
  NOW()
),
(
  'a0000001-0000-4000-8000-000000000002'::uuid,
  'zalo_dev_trader_001',
  'trader',
  N'Trần Thị Bích',
  '0912345678',
  NULL,
  'https://picsum.photos/seed/trader001/64/64',
  '{"companyName":"Công ty TNHH Nông sản Sạch Miền Tây","region":"Cần Thơ","capacity":"500 tấn/tháng","trustScore":4.7}'::jsonb,
  NULL,
  NULL,
  '2023-06-10T08:00:00.000Z'::timestamptz,
  NOW()
),
(
  'a0000001-0000-4000-8000-000000000003'::uuid,
  'zalo_dev_buyer_001',
  'buyer',
  N'Lê Minh Khoa',
  '0934567890',
  NULL,
  'https://picsum.photos/seed/buyer001/64/64',
  NULL,
  NULL,
  '{"organizationName":"Chuỗi siêu thị Xanh Plus"}'::jsonb,
  '2024-03-20T09:00:00.000Z'::timestamptz,
  NOW()
),
(
  'a0000001-0000-4000-8000-000000000004'::uuid,
  'zalo_dev_guest_001',
  'guest',
  N'Khách trải nghiệm',
  '0945678901',
  NULL,
  'https://picsum.photos/seed/guest001/64/64',
  NULL,
  NULL,
  NULL,
  '2025-01-01T00:00:00.000Z'::timestamptz,
  NOW()
)
ON CONFLICT (zalo_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  trader_profile = EXCLUDED.trader_profile,
  farmer_profile = EXCLUDED.farmer_profile,
  buyer_profile = EXCLUDED.buyer_profile,
  role = EXCLUDED.role,
  last_login = EXCLUDED.last_login;

COMMIT;
