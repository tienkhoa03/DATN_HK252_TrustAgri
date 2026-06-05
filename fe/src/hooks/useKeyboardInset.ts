/**
 * useKeyboardInset — theo dõi chiều cao bàn phím ảo (soft keyboard) trên điện thoại.
 *
 * Vì sao cần:
 *  - Trên iOS WebView, khi bàn phím hiện lên, layout viewport KHÔNG co lại; chỉ
 *    visual viewport bị thu nhỏ. Các phần tử `position: fixed` (bottom sheet,
 *    thanh nút Gửi/Tiếp theo, bottom nav) vẫn nằm nguyên → bị bàn phím che mất.
 *  - Trên Android Chromium (WebView của Zalo), khi index.html khai báo
 *    `interactive-widget=resizes-content`, layout viewport TỰ co lại nên các
 *    phần tử fixed tự dời lên trên bàn phím — lúc này hook trả về ~0 (không
 *    nâng thêm lần nữa, tránh nâng gấp đôi).
 *
 * Kết quả: trả về chiều cao (px) cần "nâng" đáy của sheet/nút lên để luôn nằm
 * trên bàn phím. = 0 khi bàn phím đóng (hoặc nền tảng đã tự co layout).
 *
 * Cách dùng:
 *   const keyboardInset = useKeyboardInset();
 *   <div style={{ bottom: keyboardInset > 0 ? keyboardInset : 'calc(64px + env(safe-area-inset-bottom,0px))' }} />
 */

import { useEffect, useState } from 'react';

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
    if (!vv) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Phần đáy của layout viewport bị bàn phím (và thanh gợi ý) che mất.
        const hidden = window.innerHeight - vv.height - vv.offsetTop;
        // < 80px coi như nhiễu (thanh địa chỉ co/giãn), không phải bàn phím.
        setInset(hidden > 80 ? Math.round(hidden) : 0);
      });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}

/**
 * Tiện ích nhỏ: gắn vào onFocus của input/textarea nằm trong vùng cuộn để
 * cuộn trường đang nhập vào giữa màn hình (trên bàn phím). An toàn khi không
 * có bàn phím (no-op về mặt thị giác).
 */
export function scrollIntoViewOnFocus(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
): void {
  const el = e.currentTarget;
  // Đợi bàn phím bắt đầu mở để vị trí cuộn chính xác.
  window.setTimeout(() => {
    try {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } catch {
      el.scrollIntoView();
    }
  }, 250);
}

export default useKeyboardInset;
