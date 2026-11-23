# Hệ thống Quản lý Thư viện (Hỗ trợ bởi AI)

> **Báo cáo thực hành Lab:** Phân tích, thiết kế và xây dựng hệ thống quản lý thư viện ứng dụng công cụ AI  
> **Sinh viên thực hiện:** Trần Văn Tuấn  
> **Mã số sinh viên (MSSV):** 29211145634  
> **Thư mục dự án:** `Lab_QLThuVien_29211145634_TranVanTuan`  
> **Kho lưu trữ GitHub:** [https://github.com/tt1871214-star/Lab_QLThuVien_29211145634_TranVanTuan](https://github.com/tt1871214-star/Lab_QLThuVien_29211145634_TranVanTuan)  
> **Công cụ AI hỗ trợ:** Google Antigravity (Agentic AI)

---

## 1. Yêu cầu môi trường & Điều kiện chạy trên Windows

Ứng dụng được xây dựng hoàn toàn bằng **HTML5, CSS3 và Vanilla JavaScript (ES6+)** thuần túy, lưu trữ dữ liệu tại máy khách bằng `LocalStorage`. Do đó, ứng dụng hoạt động mượt mà trên mọi máy tính chạy hệ điều hành Windows (Windows 10, Windows 11) mà không cần cài đặt cơ sở dữ liệu (như MySQL hay MongoDB).

### Điều kiện cần:
- Trình duyệt web hiện đại: Google Chrome, Microsoft Edge, Mozilla Firefox hoặc Brave.
- Môi trường chạy máy chủ tĩnh (chọn 1 trong các cách):
  - **Cách 1 (Khuyến nghị):** Máy đã cài **Python** (phiên bản 3.x trở lên).
  - **Cách 2:** Máy đã cài **Node.js** (phiên bản 16.x trở lên).
  - **Cách 3:** Dùng tiện ích Live Server trong VS Code.

---

## 2. Hướng dẫn khởi chạy ứng dụng

### Bước 1: Mở terminal tại thư mục gốc của dự án
Đảm bảo bạn đang đứng tại thư mục:
```powershell
d:\Lab_QLThuVien_29211145634_TranVanTuan
```

### Bước 2: Chạy máy chủ tĩnh phục vụ thư mục `src/`
Sử dụng lệnh Python tiêu chuẩn:
```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory src
```

*(Nếu dùng Node.js có thể dùng lệnh: `npx serve src -l 8000`)*

### Bước 3: Mở trình duyệt web
Truy cập địa chỉ sau trên thanh địa chỉ của trình duyệt:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 3. Chạy bộ kiểm thử tự động (Automated Unit Tests)

Dự án đi kèm bộ kiểm thử tự động gồm **13 ca kiểm thử (TC01 – TC13)** bao quát 100% các quy tắc nghiệp vụ:
```powershell
node tests/library.test.js
```

**Kết quả kiểm thử mong đợi:**
```text
====================================================
BẮT ĐẦU CHẠY KIỂM THỬ HỆ THỐNG QUẢN LÝ THƯ VIỆN
Sinh viên: Trần Văn Tuấn - MSSV: 29211145634
====================================================

[ĐẠT (PASS)] TC01: Tra cứu sách theo tên, tác giả hoặc thể loại
[ĐẠT (PASS)] TC02: Xem lịch sử mượn của từng độc giả
[ĐẠT (PASS)] TC03: Mượn bản sao có sẵn
[ĐẠT (PASS)] TC04: Chặn mượn trùng bản sao đang được mượn
[ĐẠT (PASS)] TC05: Chặn mượn bản sao hư hỏng hoặc thất lạc
[ĐẠT (PASS)] TC06: Gia hạn hợp lệ (+7 ngày)
[ĐẠT (PASS)] TC07: Chặn gia hạn lần thứ hai
[ĐẠT (PASS)] TC08: Chặn gia hạn phiếu mượn đã quá hạn
[ĐẠT (PASS)] TC09: Trả sách bình thường đúng hạn
[ĐẠT (PASS)] TC10: Xử lý trả sách khi phiếu quá hạn
[ĐẠT (PASS)] TC11: Trả sách ghi nhận hư hỏng hoặc thất lạc
[ĐẠT (PASS)] TC12: Chặn đóng lại phiếu đã xử lý
[ĐẠT (PASS)] TC13: Kiểm tra tính toàn vẹn của dữ liệu lưu trữ

====================================================
TỔNG KẾT: 13/13 CA KIỂM THỬ ĐẠT (PASS)
====================================================
```

---

## 4. Kịch bản trình diễn (Demo Walkthrough) với dữ liệu mẫu

Hệ thống được nạp sẵn bộ dữ liệu hạt giống (seed data) với đầy đủ các tình huống: sách nhiều bản sao, bản sao hư hỏng, bản sao thất lạc và phiếu mượn đã quá hạn.

### Kịch bản 1: Khám phá Tổng quan (Dashboard)
1. Mở ứng dụng, tại tab **Tổng quan**, quan sát 4 thẻ chỉ số: Tổng số đầu sách (4), Bản sao có sẵn, Phiếu đang mở, và Phiếu quá hạn (1).
2. Quan sát bảng cảnh báo phía dưới: Phiếu `PM-2026-002` của độc giả *Lê Thị Mai Chi* đang bị đánh dấu đỏ nhấp nháy vì đã quá hạn.
3. Thử đổi **Ngày hệ thống** trên thanh header để quan sát số ngày quá hạn tự động tăng/giảm theo thời gian thực.

### Kịch bản 2: Tra cứu sách và quản lý bản sao
1. Chuyển sang tab **Kho sách & Bản sao**.
2. Nhập `JavaScript` hoặc `Nguyễn Văn An` vào ô tìm kiếm: bảng sách lọc kết quả ngay lập tức.
3. Bấm **"Xem 3 bản sao"** tại cuốn sách *"Lập trình Web hiện đại với JavaScript"*:
   - Bản sao `BS-001-01`: Trạng thái *Có sẵn* (màu xanh).
   - Bản sao `BS-001-02`: Trạng thái *Đang mượn* (màu xanh dương).
   - Bản sao `BS-001-03`: Trạng thái *Hư hỏng* (màu cam).
4. Bấm nút **"Thêm bản sao"** để tạo thêm 1 bản sao mới cho cuốn sách này.

### Kịch bản 3: Tra cứu độc giả và xem lịch sử
1. Chuyển sang tab **Độc giả**.
2. Nhập từ khóa tên hoặc số điện thoại vào ô tìm kiếm độc giả.
3. Bấm nút **"Lịch sử mượn"** của độc giả *Nguyễn Văn Hùng (DG001)*: Modal mở ra hiển thị toàn bộ phiếu mượn trong quá khứ và hiện tại của độc giả này.

### Kịch bản 4: Nghiệp vụ Mượn sách và Chặn vi phạm
1. Chuyển sang tab **Mượn & Trả sách**.
2. Tại form *"Tạo phiếu mượn mới"*:
   - Chọn Độc giả: *Trần Đình Trọng (DG003)*.
   - Tại danh sách Bản sao: quan sát các bản sao hư hỏng hoặc đang mượn được chú thích rõ `(Không thể mượn)`.
   - Chọn một bản sao đang **Có sẵn** (ví dụ: `BS-002-01`).
   - Ngày mượn mặc định hôm nay, hạn trả dự kiến tự động tính chính xác `+7 ngày`.
   - Bấm **"Xác nhận lập phiếu mượn"** -> Thông báo thành công hiển thị, phiếu mượn mới xuất hiện trong bảng *Phiếu mượn đang mở*, bản sao đó trong kho tự động đổi thành *Đang mượn*.
3. Thử nghiệm chặn lỗi: Thử chọn bản sao `BS-001-03` (Hư hỏng) hoặc `BS-003-02` (Thất lạc) -> Hệ thống lập tức từ chối và hiển thị thông báo lỗi bằng tiếng Việt rõ ràng.

### Kịch bản 5: Nghiệp vụ Gia hạn sách (+7 ngày)
1. Tại bảng *Phiếu mượn đang mở*, tìm phiếu hợp lệ còn hạn `PM-2026-001`.
2. Bấm nút **"Gia hạn (+7 ngày)"**:
   - Hạn trả của phiếu được cộng thêm đúng 7 ngày.
   - Cột số lần gia hạn đổi thành `1/1 (Đã gia hạn)`.
   - Nút Gia hạn tự động bị vô hiệu hóa (disabled) để ngăn vi phạm.
3. Quan sát phiếu quá hạn `PM-2026-002`: Nút gia hạn bị vô hiệu hóa vì quy tắc nghiệp vụ cấm gia hạn phiếu đã trễ hạn.

### Kịch bản 6: Nghiệp vụ Trả sách & Thu hồi kho
1. Bấm nút **"Trả sách"** tại một phiếu đang mở: Modal tiếp nhận trả sách xuất hiện.
2. Chọn tình trạng khi thu hồi:
   - Nếu chọn *Có sẵn (Nguyên vẹn)*: Bản sao trong kho sẽ trở về trạng thái *Có sẵn*.
   - Nếu chọn *Hư hỏng (Rách trang, hư bìa)*: Bản sao sẽ chuyển sang *Hư hỏng* để đưa vào bảo trì.
   - Nếu chọn *Thất lạc*: Bản sao sẽ cập nhật *Thất lạc*.
3. Bấm **"Xác nhận hoàn tất trả sách"**: Phiếu mượn được chuyển xuống bảng *Lịch sử phiếu đã đóng (Đã trả)*, lưu ngày trả thực tế và đóng vĩnh viễn.

### Kịch bản 7: Kiểm tra lưu trữ LocalStorage & Đặt lại mẫu
1. Nhấn phím **F5** hoặc đóng trình duyệt và mở lại: Mọi dữ liệu vừa thao tác vẫn còn nguyên vẹn.
2. Khi muốn đưa hệ thống về dữ liệu mẫu ban đầu, bấm nút **"🔄 Đặt lại mẫu"** ở góc trên bên phải.

---

## 5. Cấu trúc thư mục dự án

```text
Lab_QLThuVien_29211145634_TranVanTuan/
├── .gitignore                      # Loại trừ tệp rác, gói ZIP khỏi git
├── BaoCao_Lab.md                   # Báo cáo phân tích, thiết kế, triển khai & kiểm thử
├── README.md                       # Hướng dẫn chạy và kịch bản demo
├── docs/
│   └── images/                     # Thư mục lưu ảnh minh chứng thật
│       └── README.md
├── src/                            # Mã nguồn ứng dụng web
│   ├── index.html                  # Trang giao diện chính
│   ├── css/
│   │   └── style.css               # Định dạng giao diện hiện đại & responsive
│   └── js/
│       ├── seed.js                 # Dữ liệu mẫu khởi tạo
│       ├── storage.js              # Quản lý đọc/ghi LocalStorage
│       ├── library.js              # Logic nghiệp vụ mượn, gia hạn, trả, kiểm tra
│       └── app.js                  # Điều khiển giao diện & tương tác người dùng
└── tests/
    └── library.test.js             # Bộ kiểm thử tự động 13 ca kiểm thử
```

---

## 6. Hướng dẫn đẩy mã nguồn lên GitHub & Đóng gói nộp bài

### Đẩy mã nguồn lên GitHub:
```powershell
git init
git add .
git commit -m "feat: Hoan thanh he thong quan ly thu vien ho tro boi AI"
git branch -M main
git remote add origin https://github.com/tt1871214-star/Lab_QLThuVien_29211145634_TranVanTuan.git
git push -u origin main
```
*(Nếu terminal yêu cầu đăng nhập, hãy đăng nhập qua trình duyệt hoặc cung cấp Personal Access Token (PAT) của tài khoản GitHub `tt1871214-star`)*.

### Đóng gói nộp bài:
Sau khi đã thêm các ảnh chụp màn hình thật vào thư mục `docs/images/`, chạy lệnh PowerShell sau tại thư mục dự án để tạo tệp nén:
```powershell
Compress-Archive -Path src, docs, BaoCao_Lab.md, README.md, tests, .gitignore -DestinationPath 29211145634_TranVanTuan_LabQLThuVien.zip -Force
```
Gói nộp `29211145634_TranVanTuan_LabQLThuVien.zip` sẽ chứa đầy đủ mã nguồn, tài liệu báo cáo và các hình ảnh minh chứng.
