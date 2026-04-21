import { atom } from 'jotai';

/** Số thông báo chưa đọc (đồng bộ giữa chuông nav và màn /buyer/me). */
export const notificationUnreadCountAtom = atom<number>(0);
