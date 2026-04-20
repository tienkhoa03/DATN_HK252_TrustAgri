# Agent Notes - Frontend

Muc tieu: ghi nho cac loi da gap de cac lan prompt sau khong lap lai.

## 1) Mat token do full reload

- Trieu chung:
  - Login/verify/me thanh cong nhung vao man Farmer Farm Profile lai bao chua san sang phien.
  - Request farms khong co Authorization header.
- Nguyen nhan goc:
  - Session dang luu trong Jotai memory atom (khong persist).
  - Dieu huong bang window.location.href hoac the a href gay full reload, lam mat atom.
- Cach fix dung:
  - Dung navigation trong SPA bang useNavigate cua zmp-ui.
  - Tranh window.location.href tru khi co ly do bat buoc.
  - Sau auth/login, phai set authSessionAtom ngay de interceptor co token.

## 2) Goi API lap lai qua nhieu lan

- Trieu chung:
  - Vao man Ho so vuon phat sinh nhieu request GET /api/v1/farms lien tiep.
- Nguyen nhan goc:
  - Effect va callback bi kich hoat lai nhieu lan khong co guard.
- Cach fix dung:
  - Them in-flight guard de chan request chong.
  - Them loaded key theo session (userId + accessToken) de chi load 1 lan moi session.
  - Neu chua co session/token thi khong goi API.

## 3) Handle loi khi session chua san sang

- Yeu cau:
  - Khong goi API neu token chua co.
  - Hien thong bao loi than thien cho user.
  - Khong spam request khi dang loi.

## Checklist truoc khi dong task FE lien quan auth va data fetching

1. Khong con window.location.href cho luong dieu huong trong app.
2. authSessionAtom duoc set ngay sau login thanh cong.
3. Interceptor gan Authorization tu accessTokenAtom.
4. Man hinh co guard in-flight + one-time load neu la API list.
5. Neu loi thi thong bao ro rang, khong auto loop request.

## 4) Chinh sach DELETE tren UI

- Mac dinh xem DELETE la soft delete cho du lieu nghiep vu.
- Sau khi xoa thanh cong, item bien mat khoi list mac dinh nhung khong gia dinh du lieu da bi xoa vat ly.
- Khong tu y dung hard delete behavior neu BE khong dac ta ro.

## Checklist truoc khi dong task FE lien quan DELETE

1. Mock service va integration deu theo soft delete (neu la du lieu nghiep vu).
2. UI message su dung tu "xoa" theo nghia nghiep vu, khong khang dinh xoa vinh vien.
3. Neu BE quy dinh hard delete cho du lieu tam thoi, ghi ro trong task/spec truoc khi implement.
