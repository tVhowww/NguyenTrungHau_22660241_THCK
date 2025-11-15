// src/hooks/useContacts.ts
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getDb,
  initContactsTable,
  createContact,
  toggleFavorite,
  updateContact,
  deleteContact,
  importFromApi as dbImportFromApi,
} from "../db";

export interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  favorite: number; // 0 | 1
  created_at: number;
}

// Đổi URL này thành MockAPI thật của bạn
const API_URL = "https://67c81a760acf98d07084da00.mockapi.io/api/NguyenTrungHau_22660241_SimpleContacts";

export function useContacts() {
  // ===== Trạng thái chung =====
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===== Modal thêm/sửa =====
  const [addVisible, setAddVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // ===== Modal xác nhận xóa =====
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  // ===== Search & favorite filter =====
  const [searchText, setSearchText] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // ===== Import API state =====
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // ===== Load danh sách từ DB =====
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getDb();

      const rows = await db.getAllAsync<Contact>(
        "SELECT * FROM contacts ORDER BY created_at DESC;"
      );

      setContacts(rows);
      setError(null);
    } catch (e) {
      console.error("load contacts error", e);
      setError("Không tải được danh sách liên hệ");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== Khởi tạo bảng + load lần đầu =====
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await initContactsTable();
        if (mounted) {
          setReady(true);
          await loadContacts();
        }
      } catch (e) {
        console.error("initContactsTable error", e);
        setError("Không khởi tạo được bảng contacts");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadContacts]);

  // ===== Lọc realtime theo search + favoritesOnly =====
  const filteredContacts = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return contacts.filter((c) => {
      if (favoritesOnly && c.favorite !== 1) return false;
      if (!q) return true;

      const name = c.name?.toLowerCase() ?? "";
      const phone = c.phone ?? "";

      return name.includes(q) || phone.includes(q);
    });
  }, [contacts, searchText, favoritesOnly]);

  // ===== Toggle favorite =====
  const toggleFavoriteContact = useCallback(
    async (contact: Contact) => {
      try {
        await toggleFavorite(contact.id, contact.favorite);
        await loadContacts();
      } catch (e) {
        console.error("toggleFavorite error", e);
        setError("Không cập nhật được trạng thái yêu thích");
      }
    },
    [loadContacts]
  );

  // ===== Xóa contact (mở/đóng modal + thực hiện) =====
  const startDeleteContact = useCallback((contact: Contact) => {
    setDeletingContact(contact);
    setDeleteVisible(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingContact) return;

    try {
      await deleteContact(deletingContact.id);
      await loadContacts();
      setDeleteVisible(false);
      setDeletingContact(null);
    } catch (e) {
      console.error("deleteContact error", e);
      setError("Không xóa được liên hệ");
    }
  }, [deletingContact, loadContacts]);

  const cancelDelete = useCallback(() => {
    setDeleteVisible(false);
    setDeletingContact(null);
  }, []);

  // ===== Mở/đóng modal thêm/sửa =====
  const openAddModal = useCallback(() => {
    setModalMode("add");
    setEditingContact(null);

    setNameInput("");
    setPhoneInput("");
    setEmailInput("");
    setFormError(null);

    setAddVisible(true);
  }, []);

  const openEditModal = useCallback((contact: Contact) => {
    setModalMode("edit");
    setEditingContact(contact);

    setNameInput(contact.name);
    setPhoneInput(contact.phone ?? "");
    setEmailInput(contact.email ?? "");
    setFormError(null);

    setAddVisible(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setAddVisible(false);
  }, []);

  // ===== Lưu contact (INSERT hoặc UPDATE) =====
  const saveContact = useCallback(async () => {
    if (!nameInput.trim()) {
      setFormError("Tên không được để trống");
      return;
    }
    if (phoneInput && !/^[0-9]+$/.test(phoneInput.trim())) {
      setFormError("Số điện thoại chỉ được chứa chữ số 0-9");
      return;
    }

    try {
      setFormError(null);

      if (modalMode === "add") {
        await createContact({
          name: nameInput,
          phone: phoneInput || null,
          email: emailInput || null,
        });
      } else if (modalMode === "edit" && editingContact) {
        await updateContact({
          id: editingContact.id,
          name: nameInput,
          phone: phoneInput || null,
          email: emailInput || null,
        });
      }

      await loadContacts();
      setAddVisible(false);
    } catch (e) {
      console.error("saveContact error", e);
      setFormError("Không lưu được liên hệ, thử lại sau.");
    }
  }, [
    nameInput,
    phoneInput,
    emailInput,
    modalMode,
    editingContact,
    loadContacts,
  ]);
  // ===== Import từ API (dedup theo phone) =====
  const importFromApi = useCallback(async () => {
    try {
      setImportError(null);
      setImporting(true);

      await dbImportFromApi(API_URL);
      await loadContacts();
    } catch (e) {
      console.error("importFromApi error", e);
      setImportError("Không import được từ API. Kiểm tra lại URL hoặc mạng.");
    } finally {
      setImporting(false);
    }
  }, [loadContacts]);

  // ===== Search & filter helpers =====
  const changeSearchText = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const toggleFavoritesFilter = useCallback(() => {
    setFavoritesOnly((prev) => !prev);
  }, []);

  return {
    // state chung
    ready,
    loading,
    error,

    // data
    contacts,
    filteredContacts,

    // search & filter
    searchText,
    changeSearchText,
    favoritesOnly,
    toggleFavoritesFilter,

    // favorite
    toggleFavoriteContact,

    // modal add/edit
    addVisible,
    modalMode,
    openAddModal,
    openEditModal,
    closeAddModal,
    nameInput,
    phoneInput,
    emailInput,
    setNameInput,
    setPhoneInput,
    setEmailInput,
    formError,
    saveContact,

    // modal delete
    deleteVisible,
    deletingContactName: deletingContact?.name ?? "",
    startDeleteContact,
    confirmDelete,
    cancelDelete,

    // import API
    importing,
    importError,
    importFromApi,
  };
}
