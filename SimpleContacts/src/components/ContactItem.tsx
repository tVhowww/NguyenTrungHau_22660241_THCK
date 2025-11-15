// src/components/ContactItem.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Contact } from "../hooks/useContacts";

interface ContactItemProps {
  item: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onToggleFavorite: (contact: Contact) => void;
}

export default function ContactItem({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ContactItemProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => onEdit(item)}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => onEdit(item)}>
              <Text style={styles.editText}>Sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginLeft: 12 }}
              onPress={() => onDelete(item)}
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

      <TouchableOpacity
        style={styles.favoriteBox}
        onPress={() => onToggleFavorite(item)}
      >
        <Text style={{ color: item.favorite ? "#eab308" : "#9ca3af", fontSize: 20 }}>
          ★
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
