// src/app/index.tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  getDb,
  initContactsTable,
  createContact,
  toggleFavorite,
  updateContact,
  deleteContact,
} from "@/db";

interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  favorite: number; // 0 | 1
  created_at: number;
}

// TODO: đổi thành URL MockAPI thật của bạn
const API_URL = "https://67c81a760acf98d07084da00.mockapi.io/api/NguyenTrungHau_22660241_SimpleContacts";

export default function HomeScreen() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ====== Modal thêm/sửa (C4 + C6) ======
  const [addVisible, setAddVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // ====== Modal xác nhận xóa (C7) ======
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  // ====== C8 – Search & favorite filter ======
  const [searchText, setSearchText] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // ====== C9 – Import API states ======
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // ===== load danh sách từ DB =====
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

  // ===== khởi tạo bảng + load lần đầu =====
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

  // ===== C8 – Lọc realtime =====
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

  // ===== C5 – Toggle favorite =====
  const handleToggleFavorite = async (contact: Contact) => {
    try {
      await toggleFavorite(contact.id, contact.favorite);
      await loadContacts();
    } catch (e) {
      console.error("toggleFavorite error", e);
      setError("Không cập nhật được trạng thái yêu thích");
    }
  };

  // ===== C7 – Xóa contact (Modal confirm) =====
  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
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
  };

  const cancelDelete = () => {
    setDeleteVisible(false);
    setDeletingContact(null);
  };

  // ===== C4 + C6 – Mở/đóng modal add/edit =====
  const openAddModal = () => {
    setModalMode("add");
    setEditingContact(null);

    setNameInput("");
    setPhoneInput("");
    setEmailInput("");
    setFormError(null);

    setAddVisible(true);
  };

  const openEditModal = (contact: Contact) => {
    setModalMode("edit");
    setEditingContact(contact);

    setNameInput(contact.name);
    setPhoneInput(contact.phone ?? "");
    setEmailInput(contact.email ?? "");
    setFormError(null);

    setAddVisible(true);
  };

  const closeAddModal = () => {
    setAddVisible(false);
  };

  // ===== C4 + C6 – Lưu contact (INSERT hoặc UPDATE) =====
  const handleSaveContact = async () => {
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
      closeAddModal();
    } catch (e) {
      console.error("saveContact error", e);
      setFormError("Không lưu được liên hệ, thử lại sau.");
    }
  };

  // ===== C9 – Import từ API (dedup theo phone) =====
  const handleImportFromApi = async () => {
    try {
      setImportError(null);
      setImporting(true);

      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: any[] = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu API không phải mảng");
      }

      // Tập hợp số điện thoại hiện có (tránh duplicate)
      const existingPhones = new Set(
        contacts
          .map((c) => c.phone?.trim())
          .filter((p): p is string => !!p)
      );

      for (const item of data) {
        const name = String(item.name ?? "").trim();
        const phone = item.phone ? String(item.phone).trim() : null;
        const email = item.email ? String(item.email).trim() : null;

        if (!name) continue;             // bỏ record không có name
        if (phone && existingPhones.has(phone)) continue; // trùng phone → bỏ

        await createContact({ name, phone, email });

        if (phone) existingPhones.add(phone);
      }

      await loadContacts();
    } catch (e) {
      console.error("importFromApi error", e);
      setImportError("Không import được từ API. Kiểm tra lại URL hoặc mạng.");
    } finally {
      setImporting(false);
    }
  };

  // ===== UI 1 item contact =====
  const renderItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => openEditModal(item)} // giữ để sửa
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.actionRow}>
            {/* Nút "Sửa" – C6 */}
            <TouchableOpacity onPress={() => openEditModal(item)}>
              <Text style={styles.editText}>Sửa</Text>
            </TouchableOpacity>

            {/* Nút "Xóa" – C7 */}
            <TouchableOpacity
              style={{ marginLeft: 12 }}
              onPress={() => handleDeleteContact(item)}
            >
              <Text style={styles.deleteText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {item.phone ? (
          <Text style={styles.phone}>{item.phone}</Text>
        ) : (
          <Text style={styles.phone}>Không có số điện thoại</Text>
        )}

        <Text style={styles.created}>
          Tạo lúc: {new Date(item.created_at).toLocaleString()}
        </Text>

        {item.email ? (
          <Text style={styles.email}>Email: {item.email}</Text>
        ) : null}
      </View>

      {/* Sao favorite – C5 */}
      <TouchableOpacity
        style={styles.favoriteBox}
        onPress={() => handleToggleFavorite(item)}
      >
        <Text style={{ color: item.favorite ? "#eab308" : "#9ca3af", fontSize: 20 }}>
          ★
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    const hasFilter = searchText.trim().length > 0 || favoritesOnly;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {hasFilter
            ? "Không tìm thấy liên hệ phù hợp."
            : "Chưa có liên hệ nào."}
        </Text>
      </View>
    );
  };

  // ===== trạng thái đang khởi tạo DB =====
  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Đang chuẩn bị dữ liệu…</Text>
      </View>
    );
  }

  // ===== UI chính =====
  return (
    <View style={styles.container}>
      {/* Header + Search + Favorite filter + Import (C8 + C9) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách liên hệ</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.favoriteFilterButton,
              favoritesOnly && styles.favoriteFilterButtonActive,
            ]}
            onPress={() => setFavoritesOnly((prev) => !prev)}
          >
            <Text
              style={[
                styles.favoriteFilterText,
                favoritesOnly && styles.favoriteFilterTextActive,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerBottomRow}>
          <TouchableOpacity
            style={[
              styles.importButton,
              importing && styles.importButtonDisabled,
            ]}
            onPress={handleImportFromApi}
            disabled={importing}
          >
            <Text style={styles.importButtonText}>
              {importing ? "Đang import..." : "Import từ API"}
            </Text>
          </TouchableOpacity>
        </View>

        {importError && (
          <Text style={styles.importError}>{importError}</Text>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadContacts} />
        }
        contentContainerStyle={
          filteredContacts.length === 0 ? { flex: 1 } : { paddingBottom: 80 }
        }
      />

      {error && (
        <View style={styles.errorBar}>
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        </View>
      )}

      {/* Nút + thêm liên hệ (C4) */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal thêm/sửa (C4 + C6) */}
      <Modal
        visible={addVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {modalMode === "add" ? "Thêm liên hệ mới" : "Sửa liên hệ"}
            </Text>

            <Text style={styles.label}>Tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên"
              value={nameInput}
              onChangeText={setNameInput}
            />

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={setPhoneInput}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailInput}
              onChangeText={setEmailInput}
            />

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeAddModal}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal xác nhận xóa (C7) */}
      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
            <Text style={styles.deleteModalText}>
              Bạn có chắc muốn xóa liên hệ "{deletingContact?.name}"?
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: "#111827",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  searchInput: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  favoriteFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  favoriteFilterButtonActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  favoriteFilterText: {
    color: "#e5e7eb",
    fontSize: 20,
  },
  favoriteFilterTextActive: {
    color: "#111827",
  },
  headerBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  importButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#10b981",
  },
  importButtonDisabled: {
    opacity: 0.7,
  },
  importButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  importError: {
    marginTop: 6,
    color: "#fecaca",
    fontSize: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    padding: 14,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  phone: {
    marginTop: 4,
    color: "#4b5563",
  },
  email: {
    marginTop: 4,
    color: "#4b5563",
    fontSize: 13,
  },
  created: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 12,
  },
  editText: {
    color: "#2563eb",
    fontSize: 13,
  },
  deleteText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  favoriteBox: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
  },
  errorBar: {
    padding: 8,
    backgroundColor: "#fee2e2",
  },
  // FAB
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: {
    color: "white",
    fontSize: 30,
    lineHeight: 32,
  },
  // Modal chung
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "white",
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
    color: "#4b5563",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  formError: {
    marginTop: 8,
    color: "#b91c1c",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 16,
  },
  cancelText: {
    color: "#6b7280",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: "white",
    fontWeight: "600",
  },
  // Delete modal styles
  deleteModalContainer: {
    width: "90%",
    borderRadius: 12,
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },
  deleteModalText: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
