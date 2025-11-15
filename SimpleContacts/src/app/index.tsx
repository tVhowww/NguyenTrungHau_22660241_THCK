// src/app/index.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { getDb, initContactsTable } from "@/db";

interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  favorite: number;       // 0 | 1
  created_at: number;
}

export default function HomeScreen() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ===== Câu 3: Hàm load danh sách từ DB =====
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getDb();

      const rows = await db.getAllAsync<Contact>(
        "SELECT * FROM contacts ORDER BY created_at DESC;"
      );

      setContacts(rows);
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

  // ===== UI hiển thị một item liên hệ =====
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

  // ===== Nếu đang khởi tạo DB =====
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
          contacts.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
        }
      />

      {error && (
        <View style={styles.errorBar}>
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        </View>
      )}
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
});
