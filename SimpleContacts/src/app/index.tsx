// src/app/index.tsx
import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useContacts, Contact } from "../hooks/useContacts";
import ContactItem from "../components/ContactItem";
import SearchHeader from "../components/SearchHeader";
import ContactFormModal from "../components/ContactFormModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function HomeScreen() {
  const {
    // state chung
    ready,
    loading,
    error,

    // data đã lọc
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
    deletingContactName,
    startDeleteContact,
    confirmDelete,
    cancelDelete,

    // import API
    importing,
    importError,
    importFromApi,
  } = useContacts();

  // ===== trạng thái đang khởi tạo DB =====
  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Đang chuẩn bị dữ liệu…</Text>
      </View>
    );
  }

  // ===== UI 1 item contact =====
  const renderItem = ({ item }: { item: Contact }) => (
    <ContactItem
      item={item}
      onEdit={openEditModal}
      onDelete={startDeleteContact}
      onToggleFavorite={toggleFavoriteContact}
    />
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

  // ===== UI chính =====
  return (
    <View style={styles.container}>
      {/* Header + Search + Favorite filter + Import (C8 + C9 + C10) */}
      <SearchHeader
        searchText={searchText}
        onSearchTextChange={changeSearchText}
        favoritesOnly={favoritesOnly}
        onToggleFavoritesFilter={toggleFavoritesFilter}
        importing={importing}
        onImport={importFromApi}
        importError={importError}
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={importFromApi} />
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

      {/* Nút + thêm liên hệ */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal thêm/sửa */}
      <ContactFormModal
        visible={addVisible}
        mode={modalMode}
        nameInput={nameInput}
        phoneInput={phoneInput}
        emailInput={emailInput}
        formError={formError}
        onNameChange={setNameInput}
        onPhoneChange={setPhoneInput}
        onEmailChange={setEmailInput}
        onSave={saveContact}
        onClose={closeAddModal}
      />

      {/* Modal xác nhận xóa */}
      <DeleteConfirmModal
        visible={deleteVisible}
        contactName={deletingContactName}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
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
});
