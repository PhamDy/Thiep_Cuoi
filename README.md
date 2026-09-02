# Thiệp cưới online

Trang thiệp cưới single-page, thuần HTML/CSS/JS — không cần build, không cần server. Mở `index.html` là chạy.

## Chạy thử

- Cách nhanh: bấm đúp `index.html`.
- Nếu muốn giống production (audio/loader mượt hơn): chạy static server bất kỳ, ví dụ:
  ```
  npx serve .
  ```

## Thay nội dung cho đám cưới của bạn

Chỉ cần sửa **một file**: `js/config.js`. Mọi dòng cần thay đều đánh dấu `// REPLACE:`.

| Muốn đổi | Sửa ở |
|---|---|
| Tên cô dâu / chú rể, bố mẹ, quê quán | `groom`, `bride` |
| Ngày giờ cưới (countdown + lịch) | `weddingDate` (định dạng `YYYY-MM-DDTHH:mm:ss`) |
| Các buổi lễ / tiệc + link chỉ đường | `events[]` (mỗi mục có `mapUrl`) |
| Câu trích, lời nhắn, lời mời | `quote`, `message`, `invitationText` |
| Thông tin mừng cưới (STK / ngân hàng) | `gift` |
| Dòng credit footer | `footerCredit` |

## Thay ảnh, nhạc, QR

Bỏ file thật vào `assets/` rồi trỏ đường dẫn trong `config.js`:

| Loại | Thư mục | Ghi chú |
|---|---|---|
| Ảnh album | `assets/img/` | Giữ tỉ lệ ~3:4, cập nhật mảng `gallery` |
| Ảnh QR mừng cưới | `assets/img/` | Cập nhật `gift.qrImage` |
| Nhạc nền | `assets/audio/` | File `.mp3`, cập nhật `music` |

> Ảnh/nhạc trong repo hiện tại là **placeholder tự tạo** (SVG/gradient, audio rỗng) — không phải asset bản quyền của bất kỳ template nào. Thay bằng file của bạn trước khi phát hành.

## Lưu ý

- **Nhạc nền**: trình duyệt chặn tự phát tiếng cho tới khi người dùng chạm màn hình — đây là hành vi cố ý, đúng chuẩn. Có nút bật/tắt ở góc.
- **RSVP & lời chúc**: hiện lưu ở `localStorage` của máy khách (bản demo, không có backend). Muốn thu thập thật, tìm comment `// REPLACE:` trong `js/main.js` chỗ submit để cắm API.

## Cấu trúc

```
thiep-cuoi/
├── index.html
├── css/style.css
├── js/config.js   ← sửa nội dung ở đây
├── js/main.js     ← logic (countdown, nhạc, gallery, RSVP...)
├── assets/img/
└── assets/audio/
```
