// src/components/ContactFormModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

interface ContactFormModalProps {
  visible: boolean;
  mode: "add" | "edit";
  nameInput: string;
  phoneInput: string;
  emailInput: string;
  formError: string | null;
  onNameChange: (text: string) => void;
  onPhoneChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ContactFormModal({
  visible,
  mode,
  nameInput,
  phoneInput,
  emailInput,
  formError,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onSave,
  onClose,
}: ContactFormModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {mode === "add" ? "Thêm liên hệ mới" : "Sửa liên hệ"}
          </Text>

          <Text style={styles.label}>Tên *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên"
            value={nameInput}
            onChangeText={onNameChange}
          />

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            value={phoneInput}
            onChangeText={onPhoneChange}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={emailInput}
            onChangeText={onEmailChange}
          />

          {formError ? (
            <Text style={styles.formError}>{formError}</Text>
          ) : null}

          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={onSave}
            >
              <Text style={styles.saveText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
