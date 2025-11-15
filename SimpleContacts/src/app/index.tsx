// src/app/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { initContactsTable } from "@/db";

export default function HomeScreen() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await initContactsTable(); // ⬅ tạo bảng + seed
        if (isMounted) {
          setReady(true);
        }
      } catch (e: any) {
        console.error("initContactsTable error", e);
        if (isMounted) {
          setError("Không khởi tạo được bảng contacts");
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Đang tạo bảng contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>
        Simple Contacts
      </Text>
      <Text style={{ marginTop: 4 }}>
        Contacts table ready ✅{"\n"}(đã seed dữ liệu mẫu nếu bảng trống)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
