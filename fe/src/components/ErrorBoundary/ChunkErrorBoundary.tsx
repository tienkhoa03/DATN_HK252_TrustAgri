import React, { type ReactNode } from 'react';
import { Text } from 'zmp-ui';

interface Props {
  children: ReactNode;
}

interface State {
  err?: Error;
}

/**
 * Catches chunk-load errors from lazy-loaded routes.
 * On a ChunkLoadError it attempts one soft reload (guarded by sessionStorage)
 * to recover from stale CDN URLs after a deploy.
 */
export class ChunkErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error): void {
    if (/Loading chunk|ChunkLoadError/i.test(err.message)) {
      if (!sessionStorage.getItem('chunk-reloaded')) {
        sessionStorage.setItem('chunk-reloaded', '1');
        location.reload();
      }
    }
  }

  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            gap: '16px',
          }}
        >
          <Text size="large">Đã xảy ra lỗi tải trang</Text>
          <Text size="small" style={{ color: '#888', textAlign: 'center' }}>
            {this.state.err.message}
          </Text>
          <button
            onClick={() => location.reload()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              background: '#3EBB6C',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
