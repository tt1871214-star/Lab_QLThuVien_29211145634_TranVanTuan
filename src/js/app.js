/**
 * Application Controller for Library Management System
 * Quản lý giao diện, sự kiện và liên kết dịch vụ
 * Sinh viên: Trần Văn Tuấn - MSSV: 29211145634
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Khởi tạo dữ liệu
  StorageService.initStorage();

  // 2. Trạng thái ứng dụng
  let selectedBookForCopies = null;
  let currentActiveTab = 'tab-overview';

  // 3. Khởi tạo Ngày hệ thống
  const systemDateInput = document.getElementById('system-date-input');
  const storedSystemDate = StorageService.getSystemDate();
  systemDateInput.value = storedSystemDate;

  // Lắng nghe thay đổi ngày hệ thống
  systemDateInput.addEventListener('change', (e) => {
    const newDate = e.target.value;
    if (newDate) {
      StorageService.setSystemDate(newDate);
      showToast(`Đã cập nhật ngày hệ thống: ${LibraryService.formatDateVN(newDate)}`, 'info');
      refreshAll();
    }
  });

  // Nút đặt lại dữ liệu mẫu
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu? Mọi dữ liệu tự thêm sẽ bị đặt lại.')) {
      StorageService.resetToDefault();
      showToast('Đã khôi phục dữ liệu mẫu thành công!', 'success');
      refreshAll();
    }
  });

  // 4. Điều hướng Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      currentActiveTab = targetTab;

      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      refreshCurrentTab();
    });
  });

  // ================= MODAL HELPERS =================
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Đóng modal khi bấm ra ngoài nền
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // ================= TOAST NOTIFICATION =================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ================= 1. TAB TỔNG QUAN (DASHBOARD) =================
  function renderOverview() {
    const books = StorageService.getBooks();
    const copies = StorageService.getCopies();
    const readers = StorageService.getReaders();
    const borrows = StorageService.getBorrows();
    const currentDate = StorageService.getSystemDate();

    const stats = LibraryService.calculateOverviewStats({ books, copies, borrows, currentDate });

    document.getElementById('stat-total-books').textContent = stats.totalBooks;
    document.getElementById('stat-available-copies').textContent = stats.availableCopies;
    document.getElementById('stat-active-borrows').textContent = stats.activeBorrows;
    document.getElementById('stat-overdue-borrows').textContent = stats.overdueBorrows;

    // Render danh sách cảnh báo quá hạn
    const overdueList = LibraryService.getOverdueBorrowsList({ borrows, readers, copies, books, currentDate });
    const tbody = document.getElementById('tbody-overdue-borrows');
    tbody.innerHTML = '';

    if (overdueList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="text-align: center; padding: 20px;">
        🎉 Tuyệt vời! Hiện không có phiếu mượn nào bị quá hạn.
      </td></tr>`;
      return;
    }

    overdueList.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'row-overdue';
      tr.innerHTML = `
        <td><strong>${item.borrowCode}</strong></td>
        <td>${item.readerName}</td>
        <td>${item.readerPhone || '---'}</td>
        <td><strong>${item.bookTitle}</strong> <span class="badge badge-dark">${item.copyCode}</span></td>
        <td>${LibraryService.formatDateVN(item.borrowDate)}</td>
        <td>${LibraryService.formatDateVN(item.dueDate)}</td>
        <td><span class="badge badge-overdue-pulse">Trễ ${item.overdueDays} ngày</span></td>
        <td>
          <button class="btn btn-danger btn-sm btn-action-return" data-borrow-id="${item.id}">
            📦 Thu hồi & Trả sách
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-action-return').forEach(btn => {
      btn.addEventListener('click', () => {
        const borrowId = btn.getAttribute('data-borrow-id');
        openReturnModal(borrowId);
      });
    });
  }

  // ================= 2. TAB KHO SÁCH & BẢN SAO =================
  function renderBooks() {
    const books = StorageService.getBooks();
    const copies = StorageService.getCopies();
    const keyword = document.getElementById('book-search-input').value;

    const filteredBooks = LibraryService.filterBooks({ books, copies, keyword });
    const tbody = document.getElementById('tbody-books');
    tbody.innerHTML = '';

    if (filteredBooks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="text-align: center; padding: 20px;">
        Không tìm thấy đầu sách nào phù hợp với từ khóa tra cứu.
      </td></tr>`;
      return;
    }

    filteredBooks.forEach(b => {
      const totalCopies = b.copies.length;
      const availableCopies = b.copies.filter(c => c.status === LibraryService.COPY_STATUS.AVAILABLE).length;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${b.isbn || '---'}</code></td>
        <td><strong>${b.title}</strong></td>
        <td>${b.author}</td>
        <td><span class="badge badge-info">${b.category}</span></td>
        <td>${b.publishYear || '---'}</td>
        <td>
          <span class="badge ${availableCopies > 0 ? 'badge-success' : 'badge-danger'}">
            ${availableCopies} / ${totalCopies} có sẵn
          </span>
        </td>
        <td>
          <div class="d-flex" style="gap: 6px;">
            <button class="btn btn-outline-primary btn-sm btn-view-copies" data-book-id="${b.id}">
              🔍 Xem ${totalCopies} bản sao
            </button>
            <button class="btn btn-success btn-sm btn-add-copy-direct" data-book-id="${b.id}">
              ➕ Thêm bản sao
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-view-copies').forEach(btn => {
      btn.addEventListener('click', () => {
        const bookId = btn.getAttribute('data-book-id');
        showBookCopies(bookId);
      });
    });

    tbody.querySelectorAll('.btn-add-copy-direct').forEach(btn => {
      btn.addEventListener('click', () => {
        const bookId = btn.getAttribute('data-book-id');
        openAddCopyModal(bookId);
      });
    });
  }

  function showBookCopies(bookId) {
    selectedBookForCopies = bookId;
    const books = StorageService.getBooks();
    const copies = StorageService.getCopies();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const panel = document.getElementById('copies-detail-panel');
    panel.style.display = 'block';
    document.getElementById('selected-book-title').innerHTML = `📖 Bản sao của đầu sách: <span class="text-primary">${book.title}</span>`;

    const bookCopies = copies.filter(c => c.bookId === bookId);
    const tbody = document.getElementById('tbody-book-copies');
    tbody.innerHTML = '';

    if (bookCopies.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="text-align: center; padding: 20px;">
        Đầu sách này chưa có bản sao nào trong kho. Hãy bấm "Thêm bản sao" để bổ sung.
      </td></tr>`;
      return;
    }

    bookCopies.forEach(cp => {
      let badgeClass = 'badge-dark';
      if (cp.status === LibraryService.COPY_STATUS.AVAILABLE) badgeClass = 'badge-success';
      if (cp.status === LibraryService.COPY_STATUS.BORROWED) badgeClass = 'badge-primary';
      if (cp.status === LibraryService.COPY_STATUS.DAMAGED) badgeClass = 'badge-warning';
      if (cp.status === LibraryService.COPY_STATUS.LOST) badgeClass = 'badge-danger';

      const statusText = LibraryService.COPY_STATUS_TEXT[cp.status] || cp.status;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${cp.copyCode}</strong></td>
        <td>${cp.location || 'Chưa định vị'}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td><small class="text-muted">${cp.note || '---'}</small></td>
        <td>
          <select class="form-control-sm select-change-status" data-copy-id="${cp.id}" ${cp.status === LibraryService.COPY_STATUS.BORROWED ? 'disabled title="Sách đang được mượn, không thể đổi trạng thái tự do"' : ''}>
            <option value="available" ${cp.status === 'available' ? 'selected' : ''}>Có sẵn</option>
            <option value="damaged" ${cp.status === 'damaged' ? 'selected' : ''}>Hư hỏng</option>
            <option value="lost" ${cp.status === 'lost' ? 'selected' : ''}>Thất lạc</option>
            ${cp.status === 'borrowed' ? '<option value="borrowed" selected>Đang mượn</option>' : ''}
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.select-change-status').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const copyId = sel.getAttribute('data-copy-id');
        const newStatus = e.target.value;
        StorageService.updateCopyStatus(copyId, newStatus);
        showToast(`Cập nhật trạng thái bản sao thành "${LibraryService.COPY_STATUS_TEXT[newStatus]}"`, 'success');
        renderBooks();
        showBookCopies(selectedBookForCopies);
        renderOverview();
      });
    });

    // Cuộn mượt đến bảng bản sao
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Sự kiện tìm kiếm sách
  document.getElementById('book-search-input').addEventListener('input', renderBooks);
  document.getElementById('btn-clear-book-search').addEventListener('click', () => {
    document.getElementById('book-search-input').value = '';
    renderBooks();
  });

  // Modal Thêm đầu sách mới
  document.getElementById('btn-open-add-book').addEventListener('click', () => {
    document.getElementById('form-add-book').reset();
    document.getElementById('book-year').value = new Date().getFullYear();
    document.getElementById('book-initial-copies').value = 1;
    openModal('modal-add-book');
  });

  document.getElementById('form-add-book').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const category = document.getElementById('book-category').value.trim();
    const isbn = document.getElementById('book-isbn').value.trim();
    const year = parseInt(document.getElementById('book-year').value) || new Date().getFullYear();
    const publisher = document.getElementById('book-publisher').value.trim();
    const initialCopiesCount = parseInt(document.getElementById('book-initial-copies').value) || 1;

    if (!title || !author || !category) {
      showToast('Vui lòng điền đầy đủ Tên sách, Tác giả và Thể loại!', 'danger');
      return;
    }

    const books = StorageService.getBooks();
    const newBookId = 'B' + String(books.length + 1).padStart(3, '0');

    const newBook = {
      id: newBookId,
      isbn: isbn || `978-604-${Math.floor(1000 + Math.random() * 9000)}-${books.length + 1}`,
      title,
      author,
      category,
      publishYear: year,
      publisher: publisher || 'NXB Tri Thức'
    };

    StorageService.addBook(newBook);

    // Tự sinh số bản sao ban đầu
    for (let i = 1; i <= initialCopiesCount; i++) {
      const copyCode = `BS-${newBookId.slice(1)}-${String(i).padStart(2, '0')}`;
      const newCopy = {
        id: `CP-${newBookId}-${String(i).padStart(2, '0')}`,
        bookId: newBookId,
        copyCode: copyCode,
        status: LibraryService.COPY_STATUS.AVAILABLE,
        location: 'Kệ mới - Tầng 1',
        note: 'Bản sao mới tạo'
      };
      StorageService.addCopy(newCopy);
    }

    closeModal('modal-add-book');
    showToast(`Đã thêm đầu sách "${title}" cùng ${initialCopiesCount} bản sao có sẵn!`, 'success');
    renderBooks();
    renderOverview();
    showBookCopies(newBookId);
  });

  // Modal Thêm bản sao cho đầu sách
  function openAddCopyModal(bookId) {
    const books = StorageService.getBooks();
    const copies = StorageService.getCopies();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('form-add-copy').reset();
    document.getElementById('copy-target-book-id').value = bookId;
    document.getElementById('copy-target-book-name').textContent = `${book.title} (${book.author})`;

    const existingCount = copies.filter(c => c.bookId === bookId).length;
    const suggestedCode = `BS-${bookId.slice(1)}-${String(existingCount + 1).padStart(2, '0')}`;
    document.getElementById('copy-code-input').value = suggestedCode;
    document.getElementById('copy-location-input').value = 'Kệ A1 - Tầng 2';

    openModal('modal-add-copy');
  }

  document.getElementById('btn-open-add-copy').addEventListener('click', () => {
    if (selectedBookForCopies) {
      openAddCopyModal(selectedBookForCopies);
    }
  });

  document.getElementById('form-add-copy').addEventListener('submit', (e) => {
    e.preventDefault();
    const bookId = document.getElementById('copy-target-book-id').value;
    const copyCode = document.getElementById('copy-code-input').value.trim();
    const location = document.getElementById('copy-location-input').value.trim();
    const status = document.getElementById('copy-status-select').value;
    const note = document.getElementById('copy-note-input').value.trim();

    if (!copyCode) {
      showToast('Vui lòng nhập mã bản sao!', 'danger');
      return;
    }

    // Kiểm tra trùng mã bản sao
    const copies = StorageService.getCopies();
    if (copies.some(c => c.copyCode.toLowerCase() === copyCode.toLowerCase())) {
      showToast(`Mã bản sao "${copyCode}" đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`, 'danger');
      return;
    }

    const newCopy = {
      id: 'CP-' + Date.now().toString().slice(-6),
      bookId,
      copyCode,
      status,
      location: location || 'Kho trung tâm',
      note: note || 'Bản sao bổ sung'
    };

    StorageService.addCopy(newCopy);
    closeModal('modal-add-copy');
    showToast(`Đã thêm bản sao "${copyCode}" thành công!`, 'success');
    renderBooks();
    showBookCopies(bookId);
    renderOverview();
  });

  // ================= 3. TAB ĐỘC GIẢ =================
  function renderReaders() {
    const readers = StorageService.getReaders();
    const keyword = document.getElementById('reader-search-input').value;
    const filteredReaders = LibraryService.filterReaders({ readers, keyword });
    const tbody = document.getElementById('tbody-readers');
    tbody.innerHTML = '';

    if (filteredReaders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="text-align: center; padding: 20px;">
        Không tìm thấy độc giả nào phù hợp.
      </td></tr>`;
      return;
    }

    filteredReaders.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.readerCode}</strong></td>
        <td><strong>${r.fullName}</strong></td>
        <td>${r.phone || '---'}</td>
        <td>${r.email || '---'}</td>
        <td>${r.address || '---'}</td>
        <td>${LibraryService.formatDateVN(r.registeredDate)}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm btn-view-history" data-reader-id="${r.id}">
            📜 Lịch sử mượn
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-view-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const readerId = btn.getAttribute('data-reader-id');
        openReaderHistoryModal(readerId);
      });
    });
  }

  document.getElementById('reader-search-input').addEventListener('input', renderReaders);
  document.getElementById('btn-clear-reader-search').addEventListener('click', () => {
    document.getElementById('reader-search-input').value = '';
    renderReaders();
  });

  // Modal Thêm độc giả
  document.getElementById('btn-open-add-reader').addEventListener('click', () => {
    document.getElementById('form-add-reader').reset();
    openModal('modal-add-reader');
  });

  document.getElementById('form-add-reader').addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = document.getElementById('reader-name').value.trim();
    const phone = document.getElementById('reader-phone').value.trim();
    const email = document.getElementById('reader-email').value.trim();
    const address = document.getElementById('reader-address').value.trim();

    if (!fullName || !phone || !email) {
      showToast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email!', 'danger');
      return;
    }

    const readers = StorageService.getReaders();
    const newReaderId = 'RD' + String(readers.length + 1).padStart(3, '0');
    const newReaderCode = 'DG' + String(readers.length + 1).padStart(3, '0');

    const newReader = {
      id: newReaderId,
      readerCode: newReaderCode,
      fullName,
      phone,
      email,
      address: address || 'TP. Hồ Chí Minh',
      registeredDate: StorageService.getSystemDate()
    };

    StorageService.addReader(newReader);
    closeModal('modal-add-reader');
    showToast(`Tạo hồ sơ độc giả "${fullName}" (${newReaderCode}) thành công!`, 'success');
    renderReaders();
  });

  // Modal Xem lịch sử độc giả
  function openReaderHistoryModal(readerId) {
    const readers = StorageService.getReaders();
    const borrows = StorageService.getBorrows();
    const copies = StorageService.getCopies();
    const books = StorageService.getBooks();

    const reader = readers.find(r => r.id === readerId);
    if (!reader) return;

    document.getElementById('history-reader-name').textContent = `${reader.fullName} (${reader.readerCode})`;

    const history = LibraryService.getReaderBorrowHistory({ readerId, borrows, copies, books });
    const tbody = document.getElementById('tbody-reader-history');
    tbody.innerHTML = '';

    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="text-align: center; padding: 20px;">
        Độc giả này chưa có lịch sử mượn sách nào trong hệ thống.
      </td></tr>`;
    } else {
      history.forEach(item => {
        const isBorrowing = item.status === LibraryService.BORROW_STATUS.BORROWING;
        const statusBadge = isBorrowing
          ? '<span class="badge badge-primary">Đang mượn</span>'
          : '<span class="badge badge-success">Đã hoàn tất</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.borrowCode}</strong></td>
          <td>${item.bookTitle}</td>
          <td><span class="badge badge-dark">${item.copyCode}</span></td>
          <td>${LibraryService.formatDateVN(item.borrowDate)}</td>
          <td>${LibraryService.formatDateVN(item.dueDate)}</td>
          <td>${item.returnDate ? LibraryService.formatDateVN(item.returnDate) : '<span class="text-muted">Chưa trả</span>'}</td>
          <td>${statusBadge}</td>
          <td><small class="text-muted">${item.notes || '---'}</small></td>
        `;
        tbody.appendChild(tr);
      });
    }

    openModal('modal-reader-history');
  }

  // ================= 4. TAB MƯỢN & TRẢ SÁCH =================
  function setupBorrowForm() {
    const readers = StorageService.getReaders();
    const copies = StorageService.getCopies();
    const books = StorageService.getBooks();
    const currentDate = StorageService.getSystemDate();

    // 1. Đổ dữ liệu vào Reader select
    const readerSelect = document.getElementById('borrow-reader-select');
    readerSelect.innerHTML = '<option value="">-- Chọn độc giả mượn sách --</option>';
    readers.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.readerCode} - ${r.fullName} (${r.phone})`;
      readerSelect.appendChild(opt);
    });

    // 2. Đổ dữ liệu vào Copy select (hiển thị rõ ràng tình trạng)
    const copySelect = document.getElementById('borrow-copy-select');
    copySelect.innerHTML = '<option value="">-- Chọn bản sao trong kho --</option>';

    copies.forEach(c => {
      const book = books.find(b => b.id === c.bookId) || { title: 'Sách không rõ' };
      const opt = document.createElement('option');
      opt.value = c.id;

      const isAvailable = c.status === LibraryService.COPY_STATUS.AVAILABLE;
      const statusText = LibraryService.COPY_STATUS_TEXT[c.status] || c.status;

      opt.textContent = `[${c.copyCode}] ${book.title} — Trạng thái: ${statusText}`;

      // Nếu không có sẵn thì thêm chú thích hoặc disable
      if (!isAvailable) {
        opt.textContent += ' (Không thể mượn)';
        opt.style.color = '#94a3b8';
      }

      copySelect.appendChild(opt);
    });

    // 3. Ngày mượn mặc định và tính hạn trả dự kiến
    const borrowDateInput = document.getElementById('borrow-date-input');
    borrowDateInput.value = currentDate;
    updatePreviewDueDate();
  }

  function updatePreviewDueDate() {
    const borrowDateVal = document.getElementById('borrow-date-input').value;
    if (borrowDateVal) {
      const due = LibraryService.addDays(borrowDateVal, LibraryService.DEFAULT_LOAN_DAYS);
      document.getElementById('preview-due-date').textContent = `${LibraryService.formatDateVN(due)} (Đúng 7 ngày sau)`;
    } else {
      document.getElementById('preview-due-date').textContent = '---';
    }
  }

  document.getElementById('borrow-date-input').addEventListener('change', updatePreviewDueDate);

  // Form tạo phiếu mượn
  document.getElementById('form-create-borrow').addEventListener('submit', (e) => {
    e.preventDefault();
    const readerId = document.getElementById('borrow-reader-select').value;
    const copyId = document.getElementById('borrow-copy-select').value;
    const borrowDate = document.getElementById('borrow-date-input').value;
    const notes = document.getElementById('borrow-notes-input').value.trim();

    const readers = StorageService.getReaders();
    const copies = StorageService.getCopies();
    const borrows = StorageService.getBorrows();

    const result = LibraryService.createBorrow({
      readerId,
      copyId,
      borrowDate,
      notes,
      readers,
      copies,
      borrows
    });

    if (!result.success) {
      showToast(result.message, 'danger');
      return;
    }

    // Lưu phiếu mượn mới
    StorageService.addBorrow(result.borrow);

    // Cập nhật tình trạng bản sao sang 'borrowed'
    StorageService.updateCopyStatus(copyId, result.updatedCopyStatus);

    showToast(result.message, 'success');

    // Reset form
    document.getElementById('form-create-borrow').reset();
    document.getElementById('borrow-date-input').value = StorageService.getSystemDate();
    updatePreviewDueDate();

    refreshAll();
  });

  // Render danh sách phiếu mượn đang mở và đã đóng
  function renderBorrows() {
    const borrows = StorageService.getBorrows();
    const readers = StorageService.getReaders();
    const copies = StorageService.getCopies();
    const books = StorageService.getBooks();
    const currentDate = StorageService.getSystemDate();

    const activeBorrows = borrows.filter(b => b.status === LibraryService.BORROW_STATUS.BORROWING);
    const closedBorrows = borrows.filter(b => b.status === LibraryService.BORROW_STATUS.RETURNED);

    document.getElementById('badge-active-count').textContent = `${activeBorrows.length} phiếu`;

    // 1. Render Active Borrows Table
    const tbodyActive = document.getElementById('tbody-active-borrows');
    tbodyActive.innerHTML = '';

    if (activeBorrows.length === 0) {
      tbodyActive.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="text-align: center; padding: 20px;">
        Hiện không có phiếu mượn nào đang mở.
      </td></tr>`;
    } else {
      activeBorrows.forEach(b => {
        const reader = readers.find(r => r.id === b.readerId) || { fullName: 'Không rõ', phone: '' };
        const copy = copies.find(c => c.id === b.copyId) || { copyCode: 'N/A', bookId: '' };
        const book = books.find(bk => bk.id === copy.bookId) || { title: 'Không rõ' };

        const isOverdue = LibraryService.isOverdue(b.dueDate, currentDate);
        const overdueDays = isOverdue ? LibraryService.calculateOverdueDays(b.dueDate, currentDate) : 0;

        const tr = document.createElement('tr');
        if (isOverdue) tr.className = 'row-overdue';

        const statusBadge = isOverdue
          ? `<span class="badge badge-overdue-pulse">Quá hạn ${overdueDays} ngày</span>`
          : `<span class="badge badge-success">Còn hạn</span>`;

        const renewBadge = b.renewCount >= 1
          ? `<span class="badge badge-warning">1/1 (Đã gia hạn)</span>`
          : `<span class="badge badge-info">0/1</span>`;

        tr.innerHTML = `
          <td><strong>${b.borrowCode}</strong></td>
          <td><strong>${reader.fullName}</strong><br><small class="text-muted">${reader.phone || ''}</small></td>
          <td><strong>${book.title}</strong><br><span class="badge badge-dark">${copy.copyCode}</span></td>
          <td>${LibraryService.formatDateVN(b.borrowDate)}</td>
          <td><strong>${LibraryService.formatDateVN(b.dueDate)}</strong></td>
          <td>${statusBadge}</td>
          <td>${renewBadge}</td>
          <td>
            <div class="d-flex" style="gap: 6px;">
              <button class="btn btn-warning btn-sm btn-action-renew" data-borrow-id="${b.id}" ${b.renewCount >= 1 || isOverdue ? 'disabled title="Không đủ điều kiện gia hạn"' : ''}>
                🔄 Gia hạn (+7 ngày)
              </button>
              <button class="btn btn-success btn-sm btn-action-return" data-borrow-id="${b.id}">
                📦 Trả sách
              </button>
            </div>
          </td>
        `;
        tbodyActive.appendChild(tr);
      });
    }

    // Gắn sự kiện Gia hạn
    tbodyActive.querySelectorAll('.btn-action-renew').forEach(btn => {
      btn.addEventListener('click', () => {
        const borrowId = btn.getAttribute('data-borrow-id');
        handleRenewBorrow(borrowId);
      });
    });

    // Gắn sự kiện Trả sách
    tbodyActive.querySelectorAll('.btn-action-return').forEach(btn => {
      btn.addEventListener('click', () => {
        const borrowId = btn.getAttribute('data-borrow-id');
        openReturnModal(borrowId);
      });
    });

    // 2. Render Closed Borrows Table
    const tbodyClosed = document.getElementById('tbody-closed-borrows');
    tbodyClosed.innerHTML = '';

    if (closedBorrows.length === 0) {
      tbodyClosed.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="text-align: center; padding: 20px;">
        Chưa có phiếu mượn nào được đóng trong hệ thống.
      </td></tr>`;
    } else {
      closedBorrows.forEach(b => {
        const reader = readers.find(r => r.id === b.readerId) || { fullName: 'Không rõ' };
        const copy = copies.find(c => c.id === b.copyId) || { copyCode: 'N/A', bookId: '' };
        const book = books.find(bk => bk.id === copy.bookId) || { title: 'Không rõ' };

        let conditionBadge = '<span class="badge badge-success">Có sẵn</span>';
        if (b.returnCondition === 'damaged') conditionBadge = '<span class="badge badge-warning">Hư hỏng</span>';
        if (b.returnCondition === 'lost') conditionBadge = '<span class="badge badge-danger">Thất lạc</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${b.borrowCode}</strong></td>
          <td>${reader.fullName}</td>
          <td><strong>${book.title}</strong> <span class="badge badge-dark">${copy.copyCode}</span></td>
          <td>${LibraryService.formatDateVN(b.borrowDate)}</td>
          <td>${LibraryService.formatDateVN(b.dueDate)}</td>
          <td><strong>${LibraryService.formatDateVN(b.returnDate)}</strong></td>
          <td>${conditionBadge}</td>
          <td><small class="text-muted">${b.notes || '---'}</small></td>
        `;
        tbodyClosed.appendChild(tr);
      });
    }
  }

  // Xử lý gia hạn
  function handleRenewBorrow(borrowId) {
    const borrows = StorageService.getBorrows();
    const currentDate = StorageService.getSystemDate();

    const result = LibraryService.processRenew({ borrowId, currentDate, borrows });
    if (!result.success) {
      showToast(result.message, 'danger');
      return;
    }

    StorageService.updateBorrow(result.borrow);
    showToast(result.message, 'success');
    refreshAll();
  }

  // Modal Trả sách
  function openReturnModal(borrowId) {
    const borrows = StorageService.getBorrows();
    const readers = StorageService.getReaders();
    const copies = StorageService.getCopies();
    const books = StorageService.getBooks();
    const currentDate = StorageService.getSystemDate();

    const borrow = borrows.find(b => b.id === borrowId);
    if (!borrow) {
      showToast('Không tìm thấy phiếu mượn!', 'danger');
      return;
    }

    const check = LibraryService.validateReturn({ borrowId, borrows });
    if (!check.isValid) {
      showToast(check.message, 'danger');
      return;
    }

    const reader = readers.find(r => r.id === borrow.readerId) || { fullName: 'Không rõ' };
    const copy = copies.find(c => c.id === borrow.copyId) || { copyCode: 'N/A', bookId: '' };
    const book = books.find(bk => bk.id === copy.bookId) || { title: 'Không rõ' };

    document.getElementById('return-borrow-id').value = borrowId;
    document.getElementById('return-info-code').textContent = borrow.borrowCode;
    document.getElementById('return-info-reader').textContent = reader.fullName;
    document.getElementById('return-info-book').textContent = book.title;
    document.getElementById('return-info-copy').textContent = copy.copyCode;
    document.getElementById('return-info-due').textContent = LibraryService.formatDateVN(borrow.dueDate);

    // Kiểm tra quá hạn
    const overdueAlert = document.getElementById('return-overdue-alert');
    const isOverdue = LibraryService.isOverdue(borrow.dueDate, currentDate);
    if (isOverdue) {
      const days = LibraryService.calculateOverdueDays(borrow.dueDate, currentDate);
      overdueAlert.style.display = 'block';
      overdueAlert.textContent = `⚠️ CẢNH BÁO: Phiếu này đã quá hạn ${days} ngày tính đến ngày xử lý!`;
    } else {
      overdueAlert.style.display = 'none';
    }

    document.getElementById('return-date-input').value = currentDate;
    document.getElementById('return-condition-select').value = 'available';
    document.getElementById('return-notes-input').value = '';

    openModal('modal-return-book');
  }

  document.getElementById('form-return-book').addEventListener('submit', (e) => {
    e.preventDefault();
    const borrowId = document.getElementById('return-borrow-id').value;
    const returnDate = document.getElementById('return-date-input').value;
    const returnCondition = document.getElementById('return-condition-select').value;
    const notes = document.getElementById('return-notes-input').value.trim();

    const borrows = StorageService.getBorrows();
    const copies = StorageService.getCopies();

    const result = LibraryService.processReturn({
      borrowId,
      returnDate,
      returnCondition,
      note: notes,
      borrows,
      copies
    });

    if (!result.success) {
      showToast(result.message, 'danger');
      return;
    }

    // Cập nhật phiếu mượn
    StorageService.updateBorrow(result.borrow);

    // Cập nhật tình trạng bản sao
    StorageService.updateCopyStatus(result.copyId, result.updatedCopyStatus);

    closeModal('modal-return-book');
    showToast(result.message, result.isOverdue ? 'warning' : 'success');
    refreshAll();
  });

  // ================= TỔNG HỢP VÀ REFRESH =================
  function refreshCurrentTab() {
    if (currentActiveTab === 'tab-overview') renderOverview();
    if (currentActiveTab === 'tab-books') {
      renderBooks();
      if (selectedBookForCopies) showBookCopies(selectedBookForCopies);
    }
    if (currentActiveTab === 'tab-readers') renderReaders();
    if (currentActiveTab === 'tab-borrows') {
      setupBorrowForm();
      renderBorrows();
    }
  }

  function refreshAll() {
    renderOverview();
    renderBooks();
    renderReaders();
    setupBorrowForm();
    renderBorrows();
    if (selectedBookForCopies) {
      showBookCopies(selectedBookForCopies);
    }
  }

  // Lần đầu tải trang
  refreshAll();
});
