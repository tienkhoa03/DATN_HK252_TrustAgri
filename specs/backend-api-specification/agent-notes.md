# Agent Notes - Backend

Muc tieu: ghi nho cac loi da gap de cac lan prompt sau khong lap lai.

## 1) Farm location bi null du payload co du lieu

- Trieu chung:
  - POST /api/v1/farms tra ve 500.
  - Log DB: null value in column "location" of relation "farms" violates not-null constraint.
- Nguyen nhan goc:
  - ValidationPipe dang bat whitelist=true.
  - Field location trong DTO khong co decorator validate nested phu hop, nen bi strip khoi body.
- Cach fix dung:
  - Tao DTO lồng cho location (province, district, addressLine, lat, lng).
  - Gan IsDefined + IsObject + ValidateNested + Type cho CreateFarmDto.location.
  - Gan ValidateNested + Type cho UpdateFarmDto.location.
- Quy tac cho cac prompt sau:
  - Bat ky object nested nao trong request DTO deu phai co class DTO rieng + ValidateNested + Type.
  - Neu co whitelist=true ma khong co decorator, coi nhu field co nguy co bi loai bo.

## 2) Tieu chuan xu ly loi can duy tri

- Loi payload sai phai tra 400 validation ro rang.
- Khong de roi xuong 500 vi map DTO sai.
- Truoc khi ket luan loi DB, phai kiem tra duong di payload qua DTO validation.

## Checklist truoc khi dong task BE lien quan DTO

1. Request DTO da co decorator cho tat ca field bat buoc.
2. Field object/array da co ValidateNested va Type.
3. Build package shared pass.
4. Test lai endpoint voi payload that that bai truoc do.

## 3) Chinh sach DELETE mac dinh

- Mac dinh voi du lieu nghiep vu: soft delete.
- Hard delete chi dung cho du lieu khong can luu vet lich su/audit.
- Khi implement soft delete:
  - Co truong danh dau (deletedAt/isDeleted/status=deleted).
  - Cac API list mac dinh phai an ban ghi da xoa mem.
  - API detail voi ban ghi da xoa mem can thong nhat cach xu ly (404 hoac endpoint rieng includeDeleted).

## Checklist truoc khi dong task BE lien quan DELETE

1. Da xac dinh loai du lieu: nghiep vu (soft) hay tam thoi/khong can luu vet (hard).
2. Neu soft delete, query mac dinh da loai ban ghi da xoa.
3. FE contract da duoc cap nhat de khong gia dinh hard delete.
