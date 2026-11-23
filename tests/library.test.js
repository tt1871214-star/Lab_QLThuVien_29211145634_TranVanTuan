/**
 * Test Suite for Library Management System
 * Kiểm thử tự động các ca kiểm thử nghiệp vụ
 * Sinh viên: Trần Văn Tuấn - MSSV: 29211145634
 */

const { LibraryService } = require('../src/js/library.js');
const { StorageService } = require('../src/js/storage.js');
const { initialBooks, initialCopies, initialReaders, initialBorrows } = require('../src/js/seed.js');

let testResults = [];

function assert(condition, testCode, testName, expected, actual) {
  const status = condition ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)';
  testResults.push({
    testCode,
    testName,
    expected,
    actual,
    status
  });
  console.log(`[${status}] ${testCode}: ${testName}`);
  if (!condition) {
    console.error(`   Mong đợi: ${expected}`);
    console.error(`   Thực tế:  ${actual}`);
  }
}

console.log('====================================================');
console.log('BẮT ĐẦU CHẠY KIỂM THỬ HỆ THỐNG QUẢN LÝ THƯ VIỆN');
console.log('Sinh viên: Trần Văn Tuấn - MSSV: 29211145634');
console.log('====================================================\n');

// Khởi tạo storage với dữ liệu hạt giống
StorageService.resetToDefault();
let books = StorageService.getBooks();
let copies = StorageService.getCopies();
let readers = StorageService.getReaders();
let borrows = StorageService.getBorrows();
const currentDate = '2026-11-23';

// TC01: Tra cứu sách theo tên, tác giả hoặc thể loại
const searchByName = LibraryService.filterBooks({ books, copies, keyword: 'JavaScript' });
const searchByAuthor = LibraryService.filterBooks({ books, copies, keyword: 'Nguyễn Văn An' });
const searchByCategory = LibraryService.filterBooks({ books, copies, keyword: 'Trí tuệ nhân tạo' });
const tc01Passed = searchByName.length === 1 && searchByAuthor.length === 1 && searchByCategory.length === 1;
assert(
  tc01Passed,
  'TC01',
  'Tra cứu sách theo tên, tác giả hoặc thể loại',
  'Tìm đúng sách theo từ khóa tên, tác giả và thể loại',
  `Khớp: Tên (${searchByName.length}), Tác giả (${searchByAuthor.length}), Thể loại (${searchByCategory.length})`
);

// TC02: Xem lịch sử mượn của từng độc giả
const reader1History = LibraryService.getReaderBorrowHistory({ readerId: 'RD001', borrows, copies, books });
const tc02Passed = reader1History.length === 2 && reader1History[0].borrowCode !== undefined;
assert(
  tc02Passed,
  'TC02',
  'Xem lịch sử mượn của từng độc giả',
  'Trả về danh sách 2 phiếu mượn của độc giả RD001',
  `Độc giả RD001 có ${reader1History.length} phiếu trong lịch sử`
);

// TC03: Mượn bản sao có sẵn -> Tạo phiếu, hạn trả +7 ngày, bản sao đổi sang "Đang mượn"
const availableCopy = copies.find(c => c.id === 'CP-B001-01'); // BS-001-01 Có sẵn
const borrowDate = '2026-11-23';
const borrowResult = LibraryService.createBorrow({
  readerId: 'RD003',
  copyId: availableCopy.id,
  borrowDate,
  notes: 'Kiểm thử mượn sách',
  readers,
  copies,
  borrows
});

let tc03Passed = false;
if (borrowResult.success) {
  // Cập nhật storage giả lập
  StorageService.addBorrow(borrowResult.borrow);
  StorageService.updateCopyStatus(availableCopy.id, borrowResult.updatedCopyStatus);
  borrows = StorageService.getBorrows();
  copies = StorageService.getCopies();

  const updatedCopy = copies.find(c => c.id === availableCopy.id);
  tc03Passed = borrowResult.borrow.dueDate === '2026-11-30' && updatedCopy.status === 'borrowed';
}
assert(
  tc03Passed,
  'TC03',
  'Mượn bản sao có sẵn',
  'Tạo phiếu thành công, hạn trả 2026-11-30 (+7 ngày), bản sao chuyển sang "borrowed"',
  `Hạn trả: ${borrowResult.borrow ? borrowResult.borrow.dueDate : 'N/A'}, Bản sao: ${copies.find(c => c.id === availableCopy.id).status}`
);

// TC04: Chặn mượn trùng bản sao (bản sao đang được mượn)
const borrowedCopy = copies.find(c => c.status === 'borrowed');
const dupBorrowResult = LibraryService.createBorrow({
  readerId: 'RD004',
  copyId: borrowedCopy.id,
  borrowDate,
  readers,
  copies,
  borrows
});
assert(
  dupBorrowResult.success === false && dupBorrowResult.message.includes('hiện đang được mượn'),
  'TC04',
  'Chặn mượn trùng bản sao đang được mượn',
  'Từ chối mượn với thông báo bản sao đang được mượn',
  dupBorrowResult.message
);

// TC05: Chặn mượn bản sao đã hư hỏng hoặc thất lạc
const damagedCopy = copies.find(c => c.status === 'damaged');
const lostCopy = copies.find(c => c.status === 'lost');
const damagedResult = LibraryService.createBorrow({
  readerId: 'RD004',
  copyId: damagedCopy.id,
  borrowDate,
  readers,
  copies,
  borrows
});
const lostResult = LibraryService.createBorrow({
  readerId: 'RD004',
  copyId: lostCopy.id,
  borrowDate,
  readers,
  copies,
  borrows
});
const tc05Passed = damagedResult.success === false && lostResult.success === false &&
  damagedResult.message.includes('HƯ HỎNG') && lostResult.message.includes('THẤT LẠC');
assert(
  tc05Passed,
  'TC05',
  'Chặn mượn bản sao hư hỏng hoặc thất lạc',
  'Từ chối cho mượn bản sao hư hỏng hoặc thất lạc kèm thông báo lỗi rõ ràng',
  `Hư hỏng: ${damagedResult.message} | Thất lạc: ${lostResult.message}`
);

// TC06: Gia hạn thành công 1 lần (+7 ngày) khi phiếu còn hạn và chưa gia hạn
// Phiếu BR001: mượn 2026-11-20, hạn 2026-11-27, ngày hiện tại 2026-11-23 (còn hạn)
const renewResult = LibraryService.processRenew({
  borrowId: 'BR001',
  currentDate,
  borrows
});
let tc06Passed = false;
if (renewResult.success) {
  StorageService.updateBorrow(renewResult.borrow);
  borrows = StorageService.getBorrows();
  tc06Passed = renewResult.borrow.dueDate === '2026-12-04' && renewResult.borrow.renewCount === 1;
}
assert(
  tc06Passed,
  'TC06',
  'Gia hạn hợp lệ (+7 ngày)',
  'Hạn trả tăng thêm 7 ngày (từ 2026-11-27 lên 2026-12-04), renewCount = 1',
  `Hạn mới: ${renewResult.borrow ? renewResult.borrow.dueDate : 'N/A'}, renewCount: ${renewResult.borrow ? renewResult.borrow.renewCount : 'N/A'}`
);

// TC07: Chặn gia hạn lần 2
const secondRenewResult = LibraryService.processRenew({
  borrowId: 'BR001',
  currentDate,
  borrows
});
assert(
  secondRenewResult.success === false && secondRenewResult.message.includes('tối đa 1 lần'),
  'TC07',
  'Chặn gia hạn lần thứ hai',
  'Từ chối gia hạn với thông báo đã đạt số lần gia hạn tối đa 1 lần',
  secondRenewResult.message
);

// TC08: Chặn gia hạn phiếu đã quá hạn
// Phiếu BR002: hạn 2026-11-12 < ngày hiện tại 2026-11-23 (quá hạn 11 ngày)
const overdueRenewResult = LibraryService.processRenew({
  borrowId: 'BR002',
  currentDate,
  borrows
});
assert(
  overdueRenewResult.success === false && overdueRenewResult.message.includes('đã quá hạn'),
  'TC08',
  'Chặn gia hạn phiếu mượn đã quá hạn',
  'Từ chối gia hạn phiếu đã quá hạn với thông báo lỗi quy định',
  overdueRenewResult.message
);

// TC09: Trả sách bình thường -> Cập nhật bản sao về "Có sẵn", đóng phiếu
const returnNormalResult = LibraryService.processReturn({
  borrowId: 'BR001',
  returnDate: '2026-11-24',
  returnCondition: 'available',
  note: 'Trả sách nguyên vẹn',
  borrows,
  copies
});
let tc09Passed = false;
if (returnNormalResult.success) {
  StorageService.updateBorrow(returnNormalResult.borrow);
  StorageService.updateCopyStatus(returnNormalResult.copyId, returnNormalResult.updatedCopyStatus);
  borrows = StorageService.getBorrows();
  copies = StorageService.getCopies();
  const c = copies.find(x => x.id === returnNormalResult.copyId);
  tc09Passed = returnNormalResult.borrow.status === 'returned' && c.status === 'available';
}
assert(
  tc09Passed,
  'TC09',
  'Trả sách bình thường đúng hạn',
  'Phiếu chuyển sang "returned", bản sao chuyển về "available"',
  `Phiếu: ${returnNormalResult.borrow ? returnNormalResult.borrow.status : 'N/A'}, Bản sao: ${copies.find(x => x.id === returnNormalResult.copyId).status}`
);

// TC10: Xử lý phiếu quá hạn -> Cho phép đóng phiếu và ghi nhận quá hạn
const returnOverdueResult = LibraryService.processReturn({
  borrowId: 'BR002',
  returnDate: '2026-11-23',
  returnCondition: 'available',
  note: 'Xử lý nộp phạt quá hạn',
  borrows,
  copies
});
let tc10Passed = false;
if (returnOverdueResult.success) {
  StorageService.updateBorrow(returnOverdueResult.borrow);
  StorageService.updateCopyStatus(returnOverdueResult.copyId, returnOverdueResult.updatedCopyStatus);
  borrows = StorageService.getBorrows();
  copies = StorageService.getCopies();
  tc10Passed = returnOverdueResult.borrow.status === 'returned' && returnOverdueResult.isOverdue === true;
}
assert(
  tc10Passed,
  'TC10',
  'Xử lý trả sách khi phiếu quá hạn',
  'Cho phép đóng phiếu quá hạn, ghi nhận trễ hạn trong ghi chú',
  `Đóng phiếu thành công: status="${returnOverdueResult.borrow ? returnOverdueResult.borrow.status : 'N/A'}", Trễ hạn: ${returnOverdueResult.overdueDays} ngày`
);

// TC11: Trả sách ghi nhận bản sao hư hỏng hoặc thất lạc
// Mượn thử 1 bản sao khác rồi trả về với tình trạng hư hỏng
const copyForDamage = copies.find(c => c.status === 'available');
const borrowForDamage = LibraryService.createBorrow({
  readerId: 'RD002',
  copyId: copyForDamage.id,
  borrowDate: '2026-11-20',
  readers,
  copies,
  borrows
});
StorageService.addBorrow(borrowForDamage.borrow);
StorageService.updateCopyStatus(copyForDamage.id, 'borrowed');
borrows = StorageService.getBorrows();
copies = StorageService.getCopies();

const returnDamaged = LibraryService.processReturn({
  borrowId: borrowForDamage.borrow.id,
  returnDate: '2026-11-23',
  returnCondition: 'damaged',
  note: 'Làm rách gáy sách',
  borrows,
  copies
});
StorageService.updateBorrow(returnDamaged.borrow);
StorageService.updateCopyStatus(returnDamaged.copyId, returnDamaged.updatedCopyStatus);
copies = StorageService.getCopies();

const tc11Passed = returnDamaged.success === true &&
  copies.find(c => c.id === copyForDamage.id).status === 'damaged';
assert(
  tc11Passed,
  'TC11',
  'Trả sách ghi nhận hư hỏng hoặc thất lạc',
  'Phiếu đóng và bản sao được chuyển sang tình trạng "damaged"',
  `Trạng thái bản sao sau trả: ${copies.find(c => c.id === copyForDamage.id).status}`
);

// TC12: Chặn đóng lại phiếu đã xử lý
const closedBorrowId = 'BR003'; // Phiếu đã có trạng thái 'returned' từ seed
const reReturnResult = LibraryService.processReturn({
  borrowId: closedBorrowId,
  returnDate: '2026-11-23',
  returnCondition: 'available',
  borrows,
  copies
});
assert(
  reReturnResult.success === false && reReturnResult.message.includes('đã được xử lý trả trước đó'),
  'TC12',
  'Chặn đóng lại phiếu đã xử lý',
  'Từ chối trả sách cho phiếu đã đóng',
  reReturnResult.message
);

// TC13: Kiểm tra tính toàn vẹn dữ liệu lưu trữ
const savedBooks = StorageService.getBooks();
const savedCopies = StorageService.getCopies();
const savedBorrows = StorageService.getBorrows();
const savedReaders = StorageService.getReaders();
const tc13Passed = savedBooks.length >= 4 && savedCopies.length >= 8 && savedBorrows.length >= 4 && savedReaders.length >= 4;
assert(
  tc13Passed,
  'TC13',
  'Kiểm tra tính toàn vẹn của dữ liệu lưu trữ',
  'Dữ liệu sau các thao tác mượn/trả/gia hạn vẫn được lưu trữ toàn vẹn trong bộ nhớ',
  `Đầu sách: ${savedBooks.length}, Bản sao: ${savedCopies.length}, Độc giả: ${savedReaders.length}, Phiếu mượn: ${savedBorrows.length}`
);

console.log('\n====================================================');
const totalPassed = testResults.filter(t => t.status === 'ĐẠT (PASS)').length;
console.log(`TỔNG KẾT: ${totalPassed}/${testResults.length} CA KIỂM THỬ ĐẠT (PASS)`);
console.log('====================================================');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testResults };
}
