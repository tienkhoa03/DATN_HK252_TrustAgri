/**
 * LoginScreen — Form đăng nhập username/password (FR-S01).
 *
 * CHỈ render khi `VITE_AUTH_MODE=password`. Mode khác (zalo-oauth/zalo-token/dev-seeded)
 * auto-bootstrap qua `bootstrapAuthSession()` ở RootEntry; user KHÔNG bao giờ thấy màn này.
 *
 * Luồng password mode:
 *  1. User nhập username + password.
 *  2. POST /api/v1/auth/password-login → AuthSession (BE phải bật AUTH_PASSWORD_LOGIN_ENABLED).
 *  3. Set Jotai authSessionAtom → ROLE_HOME_PATH[role].
 *
 * Lỗi:
 *  - 401 sai credential → snackbar "Tên đăng nhập hoặc mật khẩu không đúng".
 *  - Mạng/server → ApiError + snackbar tiếng Việt.
 */

import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Spinner, useNavigate } from 'zmp-ui';
import { useSetAtom } from 'jotai';

import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { ENV } from '@/config/env';
import { ApiError } from '@/api/errors';
import * as authService from '@/services/authService';
import { authSessionAtom } from '@/state/authAtoms';
import { ROLE_HOME_PATH } from '@/router/roleHome';
import { primaryColors, functionalColors } from '@/design-system/tokens/colors';

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginScreen() {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();
  const setSession = useSetAtom(authSessionAtom);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guard: nếu mode != password → quay về RootEntry để auto-bootstrap.
  useEffect(() => {
    if (ENV.AUTH_MODE !== 'password') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  if (ENV.AUTH_MODE !== 'password') {
    return null;
  }

  const handleLogin = async () => {
    if (submitting) return;
    if (!username.trim()) {
      openSnackbar({ type: 'error', text: 'Vui lòng nhập tên đăng nhập', duration: 3000, icon: true });
      return;
    }
    if (!password) {
      openSnackbar({ type: 'error', text: 'Vui lòng nhập mật khẩu', duration: 3000, icon: true });
      return;
    }
    setSubmitting(true);
    try {
      const newSession = await authService.passwordLogin(username.trim(), password);
      setSession(newSession);
      const target = newSession.roles && newSession.roles.length > 1
        ? '/role-select'
        : ROLE_HOME_PATH[newSession.role] ?? '/guest';
      navigate(target, { replace: true });
    } catch (err) {
      const message = toVietnameseError(err);
      openSnackbar({ type: 'error', text: message, duration: 4500, icon: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page style={{ background: functionalColors.neutralGray, minHeight: '100vh' }}>
      {/* Header gradient */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${primaryColors.agriGreen} 0%, ${primaryColors.zaloBlue} 100%)`,
          padding: '40px 24px 32px',
          textAlign: 'center',
        }}
      >
        <Text style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>🌱</Text>
        <Text style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 8 }}>
          TrustAgri
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
          Đăng nhập demo bằng tài khoản
        </Text>
      </Box>

      <Box style={{ padding: '24px 16px 40px' }}>
        <Box
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '24px 20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            Đăng nhập
          </Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
            POST /api/v1/auth/password-login
          </Text>

          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
            disabled={submitting}
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleLogin();
            }}
            disabled={submitting}
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          <button
            onClick={() => void handleLogin()}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: submitting ? '#9CA3AF' : primaryColors.agriGreen,
              color: '#fff',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {submitting ? <Spinner /> : null}
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>

          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 14, textAlign: 'center' }}>
            Chế độ đăng nhập: <strong>{ENV.AUTH_MODE}</strong>
          </Text>
        </Box>
      </Box>
    </Page>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid #E5E7EB',
  fontSize: 15,
  outline: 'none',
  marginBottom: 12,
  boxSizing: 'border-box',
};

// ── Error mapping ─────────────────────────────────────────────────────────────

function toVietnameseError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
      case 'FORBIDDEN':
        return 'Đăng nhập username/password chưa được bật ở backend (AUTH_PASSWORD_LOGIN_ENABLED).';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Thử lại sau.';
      default:
        return err.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Đăng nhập thất bại. Vui lòng thử lại.';
}

export default LoginScreen;
