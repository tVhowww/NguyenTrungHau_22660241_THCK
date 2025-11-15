// src/components/SearchHeader.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface SearchHeaderProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  favoritesOnly: boolean;
  onToggleFavoritesFilter: () => void;
  importing: boolean;
  onImport: () => void;
  importError: string | null;
}

export default function SearchHeader({
  searchText,
  onSearchTextChange,
  favoritesOnly,
  onToggleFavoritesFilter,
  importing,
  onImport,
  importError,
}: SearchHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Danh sách liên hệ</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchText}
            onChangeText={onSearchTextChange}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.favoriteFilterButton,
            favoritesOnly && styles.favoriteFilterButtonActive,
          ]}
          onPress={onToggleFavoritesFilter}
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
          onPress={onImport}
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
  );
}

const styles = StyleSheet.create({
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
});
