# 🤖 Tool Tự Động Trả Lời Đánh Giá Trên Google Maps

Hệ thống tự động hóa cấp doanh nghiệp giúp theo dõi các đánh giá trên Google Maps và tự động trả lời sử dụng các mẫu câu có sẵn từ Google Sheet.

## ✨ Tính Năng

- **Lưu Session vĩnh viễn** — Chỉ cần đăng nhập một lần, sử dụng mãi mãi do lưu cấu hình trình duyệt.
- **Tích hợp Google Sheet** — Trả lời bằng các câu ngẫu nhiên được lấy từ Google Sheet.
- **Nhiều Địa Điểm** — Có thể cấu hình theo dõi cùng lúc nhiều cơ sở kinh doanh.
- **Hành Vi Giống Người (Human-Like)** — Delay ngẫu nhiên, mô phỏng gõ phím, tránh bị bot detect.
- **Chống Trùng Lặp** — Dữ liệu JSON tracking cục bộ chống trả lời 2 lần 1 review.
- **Log Tiếng Việt** — Chạy terminal hiện logs hoàn toàn bằng tiếng Việt thân thiện.

---

## 📋 Yêu Cầu Cài Đặt

- **Node.js** v18+ 
- **Tài khoản Google** có quyền quản lý Doanh nghiệp trên Google Maps.
- **Google Sheet** chứa các mẫu câu trả lời.

---

## 🚀 Hướng Dẫn Cài Đặt và Cấu Hình (MỚI)

### Bước 1: Tải Thư Viện (Dành cho Lập Trình Viên/Cài đặt lần đầu)

Mở terminal tại thư mục tool và chạy 2 lệnh sau:
```bash
npm install
npx playwright install chromium
```

### Bước 2: Chuẩn Bị Google Sheet (GIAO DIỆN DATA)

*(Tool hiện đã được tích hợp sẵn Service Account ngầm bên trong cấu hình chữ base64, vì thế bạn KHÔNG cần tự tạo Service Account trên Google Cloud như bản cũ).*

1. Tạo một Google Sheet mới trên Drive của bạn.
2. Tạo một tab (trang tính) mang tên chính xác cục bộ là: **`Replies`**
3. Trong tab `Replies`:
   - Dòng 1: Tiêu đề cột (Ví dụ: "Nội dung trả lời") — bot sẽ bỏ qua dòng này.
   - Từ dòng 2 trở đi: Điền các mẫu câu trả lời theo mong muốn vào **Cột A**. Bạn nên điền 30-100 câu khác nhau để bot xào (random) cho tự nhiên.
4. Bấm nút **Chia sẻ** (Share) Google Sheet cho Email sau (chỉ cần cấp quyền Viewer / Người Xem):
   `eldriesite@checkrv1212.iam.gserviceaccount.com`
5. Lấy **Sheet ID** từ đường link URL Google Sheet.
   Ví dụ link của bạn: `https://docs.google.com/spreadsheets/d/1KDO1FPP9v-8n3iGfDIIUP9vSAyjGpWqRprVpY2CgV7k/edit` 
   -> Sheet ID của bạn là cái đoạn `1KDO1FPP...` ở giữa chữ `d/` và `/edit`.

### Bước 3: Cấu Hình Tool

1. **Cập nhật ID Sheet (Trong `bot.js`)**
   Mở file chỉnh sửa `bot.js`, tìm dòng sau và dán cái Sheet ID của mình vào:
   ```javascript
   const GOOGLE_SHEET_ID = 'ĐIỀN-ID-VÀO-ĐÂY';
   ```

2. **Cập nhật doanh nghiệp (Trong `config.json`)**
   Mở file `config.json` và thiết lập tên và URL Business của bạn:
   ```json
   {
     "locations": [
       {
         "name": "Tên Cơ Sở Kinh Doanh Của Bạn",
         "url": "https://www.google.com/maps/place/Linh+Tinh..."
       }
     ]
   }
   ```

---

### Bước 4: Chạy Đăng Nhập Lần Đầu Nhất

Terminal chạy:
```bash
npm start
```
Quá trình diễn ra:
1. Tool mở tự động cửa sổ trình duyệt Chromium lên (Giao diện Google Maps).
2. Hãy bấm **Login / Đăng nhập thủ công** bằng tài khoản Google quản lý Map của bạn vào duyệt trình duyệt đó.
3. Khi bạn thấy đăng nhập thành công 100%, hãy về lại ở cửa sổ Terminal và **nhấn nhím ENTER**.
4. Tool sẽ lưu phiên (session). Ở những lần mở sau đó tool sẽ tiếp nối, KHÔNG bắt bạn đăng nhập lại nữa!

Nếu bạn có muốn test riêng phần Google Sheet không chạy web, thử:
```bash
npm run test-sheet
```

## ⚙️ Các Cấu Hình Khác (Tùy Chọn)
Bạn có thể tinh chỉnh thông số trong `config.json`:
| Biến số   | Ý Nghĩa                                                        |
|-----------|---------------------------------------------------------------|
| `checkInterval` | Số khoảng vòng chênh lệch phút lặp đi lặp lại dò Map            |
| `typingSpeed`   | Tốc độ đánh máy trên phím từng kí tự text (ms)                 |
| `delayBetween*` | Khoảng nghỉ chờ cho tác động delay tự nhiên                    |

*Lưu ý: Bạn không nên thiết đặt thông số này nhanh quá kẻo Google trừng phạt API vì nghi ngờ là Bot robot thật.* Cứ để setting như default nếu không tự tin.

## 📁 Cấu Trúc Tài Nguyên
```text
project/
├── bot.js              # Source Code chạy Tool (Tự động kèm Service Account rồi)
├── config.json         # Danh sách setup URL và các Delay
├── db.json             # Lịch sử Tool lưu local (Chống lặp)
└── session/            # (Tự gen) Profile Trình duyệt đã đăng nhập Google
```
