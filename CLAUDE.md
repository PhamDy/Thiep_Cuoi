# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dự án

Thiệp cưới online: single-page tĩnh, thuần HTML/CSS/JS (no framework, no bundler, no package.json, no tests). Toàn bộ UI text là tiếng Việt — giữ nguyên ngôn ngữ khi thêm chuỗi mới.

## Chạy

- Mở trực tiếp `index.html` (đủ cho hầu hết thay đổi).
- Giống production hơn (audio/loader): `npx serve .` rồi mở URL local.

Không có bước build/lint/test. "Kiểm thử" = mở trang, bấm **MỞ THIỆP**, cuộn hết các section.

## Kiến trúc

Ba file mang toàn bộ logic; chúng khớp với nhau qua quy ước, không qua import:

- `js/config.js` — object `WEDDING_CONFIG` gán vào `window`. **Đây là nơi duy nhất chứa nội dung.** Mọi dòng có thể thay đánh dấu `// REPLACE:`.
- `index.html` — khung tĩnh gồm 10 `<section class="sec">` bên trong `.card` (cover → lời mời → tiệc → nghi lễ → lịch → countdown → quote → RSVP → mừng cưới → album → footer), cộng các lớp nổi ngoài `.card`: intro/phong bì, đĩa nhạc, guestbook bar, modal quà, lightbox.
- `js/main.js` — IIFE, mọi thứ chạy trong `init()` ở cuối file. Không export gì.

### Ba cơ chế nối HTML ↔ config (nắm 3 cái này là đủ để sửa nội dung)

1. **`data-bind="path.to.key"`** trên phần tử HTML → `bindText()` gán `textContent` từ `WEDDING_CONFIG` theo đường dẫn dot-path. Text trong HTML chỉ là placeholder khi xem thô. Thêm field mới hiển thị dạng text → chỉ cần thêm `data-bind`, không cần đụng JS.
2. **Ảnh nền theo id** — `bindPhotos()` có bảng `map` cứng `{introPhoto: 'intro', coverPhoto: 'cover', ...}` gán `style.backgroundImage`. Thêm ảnh nền mới phải sửa cả `config.photos` lẫn bảng `map` này.
3. **Render bằng JS vào container rỗng** — `partyGroom`/`partyBride` (`renderParty`), `cereVuquy`/`cereThanhhon` (`renderCere`), `coverInfoBlock` (`renderCoverInfo`), `calGrid` (`renderCalendar`), `thumbs` (`setupAlbum`). Các khối này KHÔNG có markup trong HTML — sửa layout của chúng là sửa JS.

### Nguồn sự thật về ngày tháng — cẩn thận

Ngày giờ tồn tại ở hai dạng **không tự đồng bộ**:

- `weddingDate` (ISO) — dùng cho countdown, `introDate`, và tháng của lịch.
- Chuỗi hiển thị đã định dạng sẵn trong `events.*` và `ceremonies.*` (`date: '20 . 09 . 2026'`, `month: 'THÁNG 09'`, `weekday`, `lunar`).

`renderCalendar()` tô ngày cưới bằng cách parse `events.*.date` (`renderCoverInfo()` cũng strip prefix `THÁNG`/`NĂM`/`VÀO` bằng regex) — nên **giữ đúng định dạng chuỗi** khi sửa, và đổi ngày thì phải đổi cả hai chỗ. Âm lịch (`lunar`) điền tay, không tính tự động.

### State phía client

RSVP, lời chúc, số tim lưu ở `localStorage` (`thiepcuoi_rsvp`, `thiepcuoi_wishes`, `thiepcuoi_hearts`) — bản demo, không backend. Chỗ cắm API thật đánh dấu `// REPLACE:` trong `setupRsvp()` và `setupGuestbook()` của `js/main.js`. `getWishes()` trả về `SEED_WISHES` khi localStorage rỗng, nên trang luôn có lời chúc mẫu.

### Hiệu ứng

- **Luồng mở thiệp** phụ thuộc chuỗi `setTimeout` đã canh khớp với transition CSS (550/1300/2100ms trong `setupIntro()`); `body.pre-open` khoá scroll và ẩn UI nổi cho tới khi mở. Đổi timing CSS phải đổi cả timing JS.
- **Auto-scroll** sau khi mở, tốc độ theo `cfg.autoScrollSeconds`; huỷ khi người dùng wheel/touch/keydown (có delay 600ms "armed" để không tự huỷ ngay).
- **AOS** (`setupAOS`) tự gán class animation cho *con trực tiếp* của mỗi `.card .sec`, xoay vòng theo mảng `dirs`; override từng phần tử bằng `data-aos="aos-left|aos-right|aos-up|aos-zoom"`, loại trừ qua mảng `skip` (các lớp ảnh nền/scrim). Không cần thêm class thủ công.
- Nhạc nền: nút toggle chỉ mute/unmute; autoplay bị chặn cho tới khi người dùng bấm **MỞ THIỆP** — đây là hành vi cố ý.

## CSS

`css/style.css` một file, biến màu/font ở `:root`, chia block theo comment `/* ===== N. TÊN SECTION ===== */` khớp thứ tự section trong HTML. Layout mobile-first, `.card` giới hạn `max-width: 440px`.

## Assets

Ảnh/nhạc trong repo là **placeholder tự tạo** (SVG gradient, `assets/audio/_REPLACE_bgm.txt`) — không phải asset bản quyền. Bỏ file thật vào `assets/img/` hoặc `assets/audio/` rồi trỏ đường dẫn trong `config.js`; ảnh dọc giữ tỉ lệ ~3:4.
