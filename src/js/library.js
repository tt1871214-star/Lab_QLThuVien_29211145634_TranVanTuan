/**
 * Library Business Logic Service
 * Xử lý nghiệp vụ thư viện: mượn, gia hạn, trả, kiểm tra ràng buộc và thống kê
 * Sinh viên: Trần Văn Tuấn - MSSV: 29211145634
 */

const LibraryService = {
  // Giả định nghiệp vụ chuẩn
  DEFAULT_LOAN_DAYS: 7,
  RENEWAL_DAYS: 7,
  MAX_RENEWALS: 1,

  // Nhãn trạng thái bản sao
  COPY_STATUS: {
    AVAILABLE: 'available',
    BORROWED: 'borrowed',
    DAMAGED: 'damaged',
    LOST: 'lost'
  },

  COPY_STATUS_TEXT: {
    available: 'Có sẵn',
    borrowed: 'Đang mượn',
    damaged: 'Hư hỏng',
    lost: 'Thất lạc'
  },

  // Nhãn trạng thái phiếu mượn
  BORROW_STATUS: {
    BORROWING: 'borrowing',
    RETURNED: 'returned'
  },

  BORROW_STATUS_TEXT: {
    borrowing: 'Đang mượn',
    returned: 'Đã trả'
  },

  // --- Hàm hỗ trợ xử lý ngày tháng ---
  formatDateVN(dateStr) {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  isOverdue(dueDateStr, currentDateStr) {
    if (!dueDateStr || !currentDateStr) return false;
    return currentDateStr > dueDateStr;
  },

  calculateOverdueDays(dueDateStr, currentDateStr) {
    if (!this.isOverdue(dueDateStr, currentDateStr)) return 0;
    const due = new Date(dueDateStr + 'T00:00:00');
    const cur = new Date(currentDateStr + 'T00:00:00');
    const diffTime = cur.getTime() - due.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  },

  // --- NGHIỆP VỤ 1: MƯỢN SÁCH ---
  /**
   * Kiểm tra điều kiện tạo phiếu mượn
   * Quy tắc:
   * - Phải có độc giả hợp lệ
   * - Phải có bản sao hợp lệ
   * - Bản sao phải ở trạng thái "Có sẵn" (available)
   * - Chặn mượn nếu bản sao "Đang mượn" (trùng bản sao)
   * - Chặn mượn nếu bản sao "Hư hỏng" hoặc "Thất lạc"
   */
  validateBorrow({ readerId, copyId, borrowDate, readers, copies, borrows }) {
    if (!readerId) {
      return { isValid: false, message: 'Vui lòng chọn độc giả!' };
    }
    if (!copyId) {
      return { isValid: false, message: 'Vui lòng chọn bản sao sách cần mượn!' };
    }
    if (!borrowDate) {
      return { isValid: false, message: 'Vui lòng nhập ngày mượn!' };
    }

    const reader = readers.find(r => r.id === readerId);
    if (!reader) {
      return { isValid: false, message: 'Hồ sơ độc giả không tồn tại trong hệ thống!' };
    }

    const copy = copies.find(c => c.id === copyId);
    if (!copy) {
      return { isValid: false, message: 'Bản sao sách không tồn tại trong kho!' };
    }

    // Kiểm tra trạng thái bản sao
    if (copy.status === this.COPY_STATUS.BORROWED) {
      return {
        isValid: false,
        message: `Từ chối mượn: Bản sao "${copy.copyCode}" hiện đang được mượn bởi một độc giả khác!`
      };
    }

    if (copy.status === this.COPY_STATUS.DAMAGED) {
      return {
        isValid: false,
        message: `Từ chối mượn: Bản sao "${copy.copyCode}" đang ở trạng thái HƯ HỎNG, không thể cho mượn!`
      };
    }

    if (copy.status === this.COPY_STATUS.LOST) {
      return {
        isValid: false,
        message: `Từ chối mượn: Bản sao "${copy.copyCode}" đã THẤT LẠC, không thể cho mượn!`
      };
    }

    if (copy.status !== this.COPY_STATUS.AVAILABLE) {
      return {
        isValid: false,
        message: `Bản sao "${copy.copyCode}" không ở trạng thái sẵn sàng để mượn!`
      };
    }

    // Kiểm tra thêm: có phiếu mượn mở nào đang giữ bản sao này không
    const activeBorrow = borrows.find(b => b.copyId === copyId && b.status === this.BORROW_STATUS.BORROWING);
    if (activeBorrow) {
      return {
        isValid: false,
        message: `Từ chối mượn: Bản sao "${copy.copyCode}" đang thuộc phiếu mượn mở (${activeBorrow.borrowCode})!`
      };
    }

    const dueDate = this.addDays(borrowDate, this.DEFAULT_LOAN_DAYS);

    return {
      isValid: true,
      dueDate,
      message: 'Đủ điều kiện tạo phiếu mượn.'
    };
  },

  /**
   * Tạo phiếu mượn mới và cập nhật bản sao sang "Đang mượn"
   */
  createBorrow({ readerId, copyId, borrowDate, notes = '', readers, copies, borrows }) {
    const check = this.validateBorrow({ readerId, copyId, borrowDate, readers, copies, borrows });
    if (!check.isValid) {
      return { success: false, message: check.message };
    }

    const newBorrowId = 'BR' + Date.now().toString().slice(-6);
    const newBorrowCode = 'PM-' + new Date().getFullYear() + '-' + String(borrows.length + 1).padStart(3, '0');

    const newBorrow = {
      id: newBorrowId,
      borrowCode: newBorrowCode,
      readerId: readerId,
      copyId: copyId,
      borrowDate: borrowDate,
      dueDate: check.dueDate,
      returnDate: null,
      renewCount: 0,
      status: this.BORROW_STATUS.BORROWING,
      returnCondition: null,
      notes: notes || 'Mượn sách tiêu chuẩn'
    };

    return {
      success: true,
      borrow: newBorrow,
      updatedCopyStatus: this.COPY_STATUS.BORROWED,
      message: `Tạo phiếu mượn ${newBorrowCode} thành công! Hạn trả: ${this.formatDateVN(check.dueDate)}.`
    };
  },

  // --- NGHIỆP VỤ 2: GIA HẠN PHIẾU MƯỢN ---
  /**
   * Kiểm tra điều kiện gia hạn
   * Quy tắc:
   * - Phiếu phải đang mở (status === 'borrowing')
   * - Phiếu phải còn hạn (currentDate <= dueDate)
   * - Chưa từng gia hạn (renewCount === 0; tối đa 1 lần)
   */
  validateRenew({ borrowId, currentDate, borrows }) {
    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) {
      return { isValid: false, message: 'Không tìm thấy phiếu mượn cần gia hạn!' };
    }

    if (borrow.status !== this.BORROW_STATUS.BORROWING) {
      return {
        isValid: false,
        message: `Từ chối gia hạn: Phiếu mượn ${borrow.borrowCode} đã đóng (đã trả sách)!`
      };
    }

    if (borrow.renewCount >= this.MAX_RENEWALS) {
      return {
        isValid: false,
        message: `Từ chối gia hạn: Phiếu mượn ${borrow.borrowCode} đã được gia hạn tối đa ${this.MAX_RENEWALS} lần (+7 ngày)!`
      };
    }

    if (this.isOverdue(borrow.dueDate, currentDate)) {
      const overdueDays = this.calculateOverdueDays(borrow.dueDate, currentDate);
      return {
        isValid: false,
        message: `Từ chối gia hạn: Phiếu mượn ${borrow.borrowCode} đã quá hạn ${overdueDays} ngày (hạn: ${this.formatDateVN(borrow.dueDate)}). Quy định không cho phép gia hạn phiếu quá hạn!`
      };
    }

    const newDueDate = this.addDays(borrow.dueDate, this.RENEWAL_DAYS);

    return {
      isValid: true,
      newDueDate,
      message: `Đủ điều kiện gia hạn thêm ${this.RENEWAL_DAYS} ngày.`
    };
  },

  /**
   * Xử lý gia hạn
   */
  processRenew({ borrowId, currentDate, borrows }) {
    const check = this.validateRenew({ borrowId, currentDate, borrows });
    if (!check.isValid) {
      return { success: false, message: check.message };
    }

    const borrow = borrows.find(b => b.id === borrowId);
    const updatedBorrow = {
      ...borrow,
      dueDate: check.newDueDate,
      renewCount: borrow.renewCount + 1,
      notes: (borrow.notes ? borrow.notes + ' | ' : '') + `Gia hạn ngày ${this.formatDateVN(currentDate)} (+7 ngày)`
    };

    return {
      success: true,
      borrow: updatedBorrow,
      message: `Gia hạn thành công phiếu ${borrow.borrowCode}! Hạn trả mới: ${this.formatDateVN(check.newDueDate)}.`
    };
  },

  // --- NGHIỆP VỤ 3: TRẢ SÁCH ---
  /**
   * Kiểm tra điều kiện trả sách
   * Quy tắc:
   * - Phiếu phải đang mở
   * - Chặn đóng lại phiếu đã xử lý
   * - Cho phép xử lý trả cả khi phiếu quá hạn
   */
  validateReturn({ borrowId, borrows }) {
    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) {
      return { isValid: false, message: 'Không tìm thấy phiếu mượn cần trả!' };
    }

    if (borrow.status === this.BORROW_STATUS.RETURNED) {
      return {
        isValid: false,
        message: `Từ chối xử lý: Phiếu mượn ${borrow.borrowCode} đã được xử lý trả trước đó (ngày ${this.formatDateVN(borrow.returnDate)})!`
      };
    }

    return { isValid: true, message: 'Hợp lệ để xử lý trả sách.' };
  },

  /**
   * Xử lý trả sách, đóng phiếu và cập nhật tình trạng bản sao
   * @param {string} returnCondition - 'available' | 'damaged' | 'lost'
   */
  processReturn({ borrowId, returnDate, returnCondition = 'available', note = '', borrows, copies }) {
    const check = this.validateReturn({ borrowId, borrows });
    if (!check.isValid) {
      return { success: false, message: check.message };
    }

    const validConditions = [this.COPY_STATUS.AVAILABLE, this.COPY_STATUS.DAMAGED, this.COPY_STATUS.LOST];
    if (!validConditions.includes(returnCondition)) {
      return { success: false, message: 'Tình trạng sách khi trả không hợp lệ!' };
    }

    const borrow = borrows.find(b => b.id === borrowId);
    const copy = copies.find(c => c.id === borrow.copyId);

    const isOverdueWhenReturned = this.isOverdue(borrow.dueDate, returnDate);
    const overdueDays = isOverdueWhenReturned ? this.calculateOverdueDays(borrow.dueDate, returnDate) : 0;

    let returnNote = note || '';
    if (isOverdueWhenReturned) {
      returnNote += ` (Trả trễ ${overdueDays} ngày)`;
    }
    if (returnCondition === this.COPY_STATUS.DAMAGED) {
      returnNote += ` [Bản sao bị hư hại khi nhận lại]`;
    } else if (returnCondition === this.COPY_STATUS.LOST) {
      returnNote += ` [Độc giả báo làm thất lạc bản sao]`;
    }

    const updatedBorrow = {
      ...borrow,
      status: this.BORROW_STATUS.RETURNED,
      returnDate: returnDate,
      returnCondition: returnCondition,
      notes: (borrow.notes ? borrow.notes + ' | ' : '') + returnNote
    };

    const conditionText = this.COPY_STATUS_TEXT[returnCondition] || returnCondition;

    return {
      success: true,
      borrow: updatedBorrow,
      copyId: borrow.copyId,
      updatedCopyStatus: returnCondition,
      isOverdue: isOverdueWhenReturned,
      overdueDays: overdueDays,
      message: `Xử lý trả sách cho phiếu ${borrow.borrowCode} thành công! Tình trạng bản sao cập nhật: "${conditionText}".` +
        (isOverdueWhenReturned ? ` Ghi chú: Trả trễ ${overdueDays} ngày so với hạn.` : '')
    };
  },

  // --- NGHIỆP VỤ 4: TỔNG QUAN VÀ THỐNG KÊ ---
  /**
   * Tính toán các chỉ số thống kê
   * - Tổng số đầu sách
   * - Số bản sao có sẵn
   * - Số phiếu đang mở (đang mượn)
   * - Số phiếu quá hạn (phiếu đang mở mà ngày hiện tại > hạn trả)
   */
  calculateOverviewStats({ books, copies, borrows, currentDate }) {
    const totalBooks = books.length;
    const availableCopies = copies.filter(c => c.status === this.COPY_STATUS.AVAILABLE).length;
    const activeBorrows = borrows.filter(b => b.status === this.BORROW_STATUS.BORROWING).length;
    const overdueBorrows = borrows.filter(b => {
      return b.status === this.BORROW_STATUS.BORROWING && this.isOverdue(b.dueDate, currentDate);
    }).length;

    return {
      totalBooks,
      availableCopies,
      activeBorrows,
      overdueBorrows
    };
  },

  /**
   * Lấy danh sách các phiếu mượn đang quá hạn để hiển thị cảnh báo
   */
  getOverdueBorrowsList({ borrows, readers, copies, books, currentDate }) {
    return borrows
      .filter(b => b.status === this.BORROW_STATUS.BORROWING && this.isOverdue(b.dueDate, currentDate))
      .map(b => {
        const reader = readers.find(r => r.id === b.readerId) || { fullName: 'Không rõ', phone: '' };
        const copy = copies.find(c => c.id === b.copyId) || { copyCode: 'N/A', bookId: '' };
        const book = books.find(bk => bk.id === copy.bookId) || { title: 'Không rõ' };
        const overdueDays = this.calculateOverdueDays(b.dueDate, currentDate);
        return {
          ...b,
          readerName: reader.fullName,
          readerPhone: reader.phone,
          bookTitle: book.title,
          copyCode: copy.copyCode,
          overdueDays: overdueDays
        };
      });
  },

  // --- TÌM KIẾM VÀ LỌC ---
  filterBooks({ books, copies, keyword }) {
    if (!keyword || !keyword.trim()) {
      return books.map(book => {
        const bookCopies = copies.filter(c => c.bookId === book.id);
        return { ...book, copies: bookCopies };
      });
    }

    const cleanKw = keyword.toLowerCase().trim();
    return books
      .filter(book => {
        const matchTitle = book.title.toLowerCase().includes(cleanKw);
        const matchAuthor = book.author.toLowerCase().includes(cleanKw);
        const matchCategory = book.category.toLowerCase().includes(cleanKw);
        const matchIsbn = book.isbn ? book.isbn.toLowerCase().includes(cleanKw) : false;
        return matchTitle || matchAuthor || matchCategory || matchIsbn;
      })
      .map(book => {
        const bookCopies = copies.filter(c => c.bookId === book.id);
        return { ...book, copies: bookCopies };
      });
  },

  filterReaders({ readers, keyword }) {
    if (!keyword || !keyword.trim()) return readers;
    const cleanKw = keyword.toLowerCase().trim();
    return readers.filter(r => {
      const matchName = r.fullName.toLowerCase().includes(cleanKw);
      const matchCode = r.readerCode.toLowerCase().includes(cleanKw);
      const matchPhone = r.phone.toLowerCase().includes(cleanKw);
      const matchEmail = r.email.toLowerCase().includes(cleanKw);
      return matchName || matchCode || matchPhone || matchEmail;
    });
  },

  getReaderBorrowHistory({ readerId, borrows, copies, books }) {
    return borrows
      .filter(b => b.readerId === readerId)
      .map(b => {
        const copy = copies.find(c => c.id === b.copyId) || { copyCode: 'N/A', bookId: '' };
        const book = books.find(bk => bk.id === copy.bookId) || { title: 'Không rõ' };
        return {
          ...b,
          bookTitle: book.title,
          copyCode: copy.copyCode,
          statusText: this.BORROW_STATUS_TEXT[b.status] || b.status
        };
      })
      .sort((a, b) => (b.borrowDate || '').localeCompare(a.borrowDate || ''));
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LibraryService };
}
