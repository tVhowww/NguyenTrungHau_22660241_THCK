// src/app/index.tsx
import React, {
  useEffect,
  useState,
  useCallback,
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
import { getDb, initContactsTable, createContact } from "@/db";

interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  favorite: number; // 0 | 1
  created_at: number;
}

export default function HomeScreen() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ====== state cho Câu 4 – form thêm liên hệ ======
  const [addVisible, setAddVisible] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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

  // ===== UI 1 item contact =====
  const renderItem = ({ item }: { item: Contact }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
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
      <View style={styles.favoriteBox}>
        <Text style={{ color: item.favorite ? "#eab308" : "#9ca3af" }}>
          ★
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chưa có liên hệ nào.</Text>
      </View>
    );
  };

  // ===== Xử lý form Câu 4 =====
  const openAddModal = () => {
    setNameInput("");
    setPhoneInput("");
    setEmailInput("");
    setFormError(null);
    setAddVisible(true);
  };

  const closeAddModal = () => {
    setAddVisible(false);
  };

  const handleSaveContact = async () => {
    // validate: name không rỗng
    if (!nameInput.trim()) {
      setFormError("Tên không được để trống");
      return;
    }

    // validate cơ bản: phone nếu có thì chỉ gồm số
    if (phoneInput && !/^[0-9]+$/.test(phoneInput.trim())) {
      setFormError("Số điện thoại chỉ được chứa chữ số 0-9");
      return;
    }

    try {
      setFormError(null);
      await createContact({
        name: nameInput,
        phone: phoneInput || null,
        email: emailInput || null,
      });
      await loadContacts(); // reload list
      closeAddModal();
    } catch (e) {
      console.error("createContact error", e);
      setFormError("Không lưu được liên hệ, thử lại sau.");
    }
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
      <Text style={styles.header}>Danh sách liên hệ</Text>

      <FlatList
        data={contacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadContacts} />
        }
        contentContainerStyle={
          contacts.length === 0 ? { flex: 1 } : { paddingBottom: 80 }
        }
      />

      {error && (
        <View style={styles.errorBar}>
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        </View>
      )}

      {/* Nút + thêm liên hệ (Câu 4) */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal thêm liên hệ mới */}
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
            <Text style={styles.modalTitle}>Thêm liên hệ mới</Text>

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
    paddingBottom: 16,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "700",
    backgroundColor: "#111827",
    color: "white",
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
  // Modal
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
});
