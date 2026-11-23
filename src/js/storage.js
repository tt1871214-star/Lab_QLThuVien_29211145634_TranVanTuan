/**
 * Storage Service for Library Management System
 * Quản lý lưu trữ LocalStorage cho Hệ thống Quản lý Thư viện
 * Sinh viên: Trần Văn Tuấn - MSSV: 29211145634
 */

const STORAGE_KEYS = {
  BOOKS: 'QLTV_BOOKS',
  COPIES: 'QLTV_COPIES',
  READERS: 'QLTV_READERS',
  BORROWS: 'QLTV_BORROWS',
  SYSTEM_DATE: 'QLTV_SYSTEM_DATE' // Cho phép tùy chỉnh ngày giả lập để kiểm thử
};

// Bộ nhớ đệm tạm thời cho môi trường không có window.localStorage (ví dụ Node.js tests)
let memoryStore = {};

function getStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => memoryStore[key] || null,
    setItem: (key, val) => { memoryStore[key] = String(val); },
    removeItem: (key) => { delete memoryStore[key]; },
    clear: () => { memoryStore = {}; }
  };
}

const StorageService = {
  /**
   * Khởi tạo dữ liệu mẫu nếu LocalStorage chưa có dữ liệu
   */
  initStorage() {
    const store = getStore();
    const books = store.getItem(STORAGE_KEYS.BOOKS);
    const copies = store.getItem(STORAGE_KEYS.COPIES);
    const readers = store.getItem(STORAGE_KEYS.READERS);
    const borrows = store.getItem(STORAGE_KEYS.BORROWS);

    // Chỉ nạp dữ liệu mẫu khi chưa có dữ liệu lưu
    if (!books || !copies || !readers || !borrows) {
      this.resetToDefault();
      return true;
    }
    return false;
  },

  /**
   * Khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu
   */
  resetToDefault() {
    const store = getStore();
    let seedData;
    if (typeof initialBooks !== 'undefined') {
      seedData = {
        books: initialBooks,
        copies: initialCopies,
        readers: initialReaders,
        borrows: initialBorrows
      };
    } else if (typeof require !== 'undefined') {
      const seed = require('./seed.js');
      seedData = {
        books: seed.initialBooks,
        copies: seed.initialCopies,
        readers: seed.initialReaders,
        borrows: seed.initialBorrows
      };
    } else {
      seedData = { books: [], copies: [], readers: [], borrows: [] };
    }

    store.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(seedData.books));
    store.setItem(STORAGE_KEYS.COPIES, JSON.stringify(seedData.copies));
    store.setItem(STORAGE_KEYS.READERS, JSON.stringify(seedData.readers));
    store.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(seedData.borrows));
  },

  // --- Đầu sách (Books) ---
  getBooks() {
    const data = getStore().getItem(STORAGE_KEYS.BOOKS);
    return data ? JSON.parse(data) : [];
  },
  saveBooks(books) {
    getStore().setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  },
  addBook(newBook) {
    const books = this.getBooks();
    books.push(newBook);
    this.saveBooks(books);
    return newBook;
  },

  // --- Bản sao (Copies) ---
  getCopies() {
    const data = getStore().getItem(STORAGE_KEYS.COPIES);
    return data ? JSON.parse(data) : [];
  },
  saveCopies(copies) {
    getStore().setItem(STORAGE_KEYS.COPIES, JSON.stringify(copies));
  },
  addCopy(newCopy) {
    const copies = this.getCopies();
    copies.push(newCopy);
    this.saveCopies(copies);
    return newCopy;
  },
  updateCopyStatus(copyId, newStatus, note = null) {
    const copies = this.getCopies();
    const copyIndex = copies.findIndex(c => c.id === copyId);
    if (copyIndex !== -1) {
      copies[copyIndex].status = newStatus;
      if (note !== null) {
        copies[copyIndex].note = note;
      }
      this.saveCopies(copies);
      return copies[copyIndex];
    }
    return null;
  },

  // --- Độc giả (Readers) ---
  getReaders() {
    const data = getStore().getItem(STORAGE_KEYS.READERS);
    return data ? JSON.parse(data) : [];
  },
  saveReaders(readers) {
    getStore().setItem(STORAGE_KEYS.READERS, JSON.stringify(readers));
  },
  addReader(newReader) {
    const readers = this.getReaders();
    readers.push(newReader);
    this.saveReaders(readers);
    return newReader;
  },

  // --- Phiếu mượn (Borrows) ---
  getBorrows() {
    const data = getStore().getItem(STORAGE_KEYS.BORROWS);
    return data ? JSON.parse(data) : [];
  },
  saveBorrows(borrows) {
    getStore().setItem(STORAGE_KEYS.BORROWS, JSON.stringify(borrows));
  },
  addBorrow(newBorrow) {
    const borrows = this.getBorrows();
    borrows.unshift(newBorrow); // Đưa phiếu mới nhất lên đầu
    this.saveBorrows(borrows);
    return newBorrow;
  },
  updateBorrow(updatedBorrow) {
    const borrows = this.getBorrows();
    const index = borrows.findIndex(b => b.id === updatedBorrow.id);
    if (index !== -1) {
      borrows[index] = updatedBorrow;
      this.saveBorrows(borrows);
      return borrows[index];
    }
    return null;
  },

  // --- Ngày hệ thống giả lập (phục vụ kiểm thử ngày quá hạn linh hoạt) ---
  getSystemDate() {
    const customDate = getStore().getItem(STORAGE_KEYS.SYSTEM_DATE);
    if (customDate) return customDate;
    // Mặc định ngày mốc của đồ án hoặc ngày hiện tại máy
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  setSystemDate(dateStr) {
    getStore().setItem(STORAGE_KEYS.SYSTEM_DATE, dateStr);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageService, STORAGE_KEYS };
}
