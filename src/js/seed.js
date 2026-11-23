/**
 * Seed data for Library Management System
 * Hệ thống Quản lý Thư viện - Dữ liệu khởi tạo
 * Sinh viên: Trần Văn Tuấn - MSSV: 29211145634
 */

const initialBooks = [
  {
    id: "B001",
    isbn: "978-604-0-12345-1",
    title: "Lập trình Web hiện đại với JavaScript và Node.js",
    author: "Trần Văn Tuấn",
    category: "Công nghệ thông tin",
    publishYear: 2024,
    publisher: "NXB Thông tin và Truyền thông"
  },
  {
    id: "B002",
    isbn: "978-604-2-98765-4",
    title: "Cấu trúc dữ liệu và giải thuật thực hành",
    author: "Nguyễn Văn An",
    category: "Khoa học máy tính",
    publishYear: 2023,
    publisher: "NXB Đại học Quốc gia"
  },
  {
    id: "B003",
    isbn: "978-604-1-55443-2",
    title: "Thiết kế cơ sở dữ liệu và hệ thống thông tin",
    author: "Lê Hoàng Phúc",
    category: "Hệ thống thông tin",
    publishYear: 2022,
    publisher: "NXB Khoa học Kỹ thuật"
  },
  {
    id: "B004",
    isbn: "978-604-3-33221-9",
    title: "Trí tuệ nhân tạo và Ứng dụng trong chuyển đổi số",
    author: "Phạm Hải Đăng",
    category: "Trí tuệ nhân tạo",
    publishYear: 2025,
    publisher: "NXB Giáo dục"
  }
];

const initialCopies = [
  // B001 có nhiều bản sao (3 bản sao) với các trạng thái khác nhau:
  // BS-001-01: Có sẵn (available)
  // BS-001-02: Đang mượn (borrowed - liên kết phiếu PM-001)
  // BS-001-03: Hư hỏng (damaged)
  {
    id: "CP-B001-01",
    bookId: "B001",
    copyCode: "BS-001-01",
    status: "available",
    location: "Kệ A1 - Tầng 2",
    note: "Sách mới 100%, bảo quản tốt"
  },
  {
    id: "CP-B001-02",
    bookId: "B001",
    copyCode: "BS-001-02",
    status: "borrowed",
    location: "Kệ A1 - Tầng 2",
    note: "Đang được độc giả mượn"
  },
  {
    id: "CP-B001-03",
    bookId: "B001",
    copyCode: "BS-001-03",
    status: "damaged",
    location: "Khu vực lưu trữ bảo trì",
    note: "Bản sao bị rách bìa và mất trang 45-48"
  },

  // B002 có 2 bản sao:
  // BS-002-01: Có sẵn
  // BS-002-02: Đang mượn nhưng đã quá hạn (liên kết phiếu PM-002 quá hạn)
  {
    id: "CP-B002-01",
    bookId: "B002",
    copyCode: "BS-002-01",
    status: "available",
    location: "Kệ B2 - Tầng 1",
    note: "Bản in lần 2"
  },
  {
    id: "CP-B002-02",
    bookId: "B002",
    copyCode: "BS-002-02",
    status: "borrowed",
    location: "Kệ B2 - Tầng 1",
    note: "Mượn quá hạn cần thu hồi"
  },

  // B003 có 2 bản sao: 1 có sẵn, 1 thất lạc
  {
    id: "CP-B003-01",
    bookId: "B003",
    copyCode: "BS-003-01",
    status: "available",
    location: "Kệ C1 - Tầng 2",
    note: "Tình trạng tốt"
  },
  {
    id: "CP-B003-02",
    bookId: "B003",
    copyCode: "BS-003-02",
    status: "lost",
    location: "Không xác định",
    note: "Ghi nhận thất lạc trong đợt kiểm kê năm trước"
  },

  // B004 có 1 bản sao có sẵn
  {
    id: "CP-B004-01",
    bookId: "B004",
    copyCode: "BS-004-01",
    status: "available",
    location: "Kệ D3 - Tầng 3",
    note: "Sách mới nhập 2025"
  }
];

const initialReaders = [
  {
    id: "RD001",
    readerCode: "DG001",
    fullName: "Nguyễn Văn Hùng",
    phone: "0908123456",
    email: "hung.nguyen@email.com",
    address: "Quận 1, TP. Hồ Chí Minh",
    registeredDate: "2026-01-10"
  },
  {
    id: "RD002",
    readerCode: "DG002",
    fullName: "Lê Thị Mai Chi",
    phone: "0912345678",
    email: "maichi.le@email.com",
    address: "Bình Thạnh, TP. Hồ Chí Minh",
    registeredDate: "2026-02-15"
  },
  {
    id: "RD003",
    readerCode: "DG003",
    fullName: "Trần Đình Trọng",
    phone: "0987654321",
    email: "trong.tran@email.com",
    address: "Thủ Đức, TP. Hồ Chí Minh",
    registeredDate: "2026-03-01"
  },
  {
    id: "RD004",
    readerCode: "DG004",
    fullName: "Phạm Quỳnh Như",
    phone: "0971239988",
    email: "quynhnhu.pham@email.com",
    address: "Quận 3, TP. Hồ Chí Minh",
    registeredDate: "2026-03-12"
  }
];

// Giả định ngày hiện tại của hệ thống mốc kiểm tra: 2026-11-23
const initialBorrows = [
  // Phiếu 1: Đang mượn hợp lệ, còn hạn (mượn 2026-11-20 -> hạn 2026-11-27)
  {
    id: "BR001",
    borrowCode: "PM-2026-001",
    readerId: "RD001",
    copyId: "CP-B001-02",
    borrowDate: "2026-11-20",
    dueDate: "2026-11-27",
    returnDate: null,
    renewCount: 0,
    status: "borrowing",
    returnCondition: null,
    notes: "Mượn nghiên cứu đồ án cuối khóa"
  },
  // Phiếu 2: Đang mượn và ĐÃ QUÁ HẠN (mượn 2026-11-05 -> hạn 2026-11-12 < ngày hiện tại 2026-11-23)
  {
    id: "BR002",
    borrowCode: "PM-2026-002",
    readerId: "RD002",
    copyId: "CP-B002-02",
    borrowDate: "2026-11-05",
    dueDate: "2026-11-12",
    returnDate: null,
    renewCount: 0,
    status: "borrowing",
    returnCondition: null,
    notes: "Phiếu mượn quá hạn 11 ngày, hệ thống gửi cảnh báo"
  },
  // Phiếu 3: Phiếu đã hoàn tất trả trong lịch sử
  {
    id: "BR003",
    borrowCode: "PM-2026-003",
    readerId: "RD001",
    copyId: "CP-B004-01",
    borrowDate: "2026-11-01",
    dueDate: "2026-11-08",
    returnDate: "2026-11-07",
    renewCount: 0,
    status: "returned",
    returnCondition: "available",
    notes: "Độc giả trả sách đúng hạn, bản sao nguyên vẹn"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initialBooks,
    initialCopies,
    initialReaders,
    initialBorrows
  };
}
