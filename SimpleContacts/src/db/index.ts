// src/db/index.ts
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Mở connection
export const getDb = () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("simple_contacts.db");
  }
  return dbPromise;
};

// Tạo bảng + seed
export const initContactsTable = async () => {
  const db = await getDb();

  // 1. Tạo bảng
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      favorite INTEGER DEFAULT 0,
      created_at INTEGER
    );
  `);

  // 2. Kiểm tra dữ liệu
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM contacts;"
  );
  const count = row?.count ?? 0;

  // 3. Seed nếu không có dữ liệu
  if (count === 0) {
    const now = Date.now();

    await db.runAsync(
      "INSERT INTO contacts (name, phone, email, favorite, created_at) VALUES (?, ?, ?, ?, ?);",
      ["Nguyễn Văn A", "0901234567", "a@example.com", 0, now]
    );

    await db.runAsync(
      "INSERT INTO contacts (name, phone, email, favorite, created_at) VALUES (?, ?, ?, ?, ?);",
      ["Trần Thị B", "0987654321", "b@example.com", 1, now + 1]
    );

    await db.runAsync(
      "INSERT INTO contacts (name, phone, email, favorite, created_at) VALUES (?, ?, ?, ?, ?);",
      ["Lê Văn C", "0912345678", null, 0, now + 2]
    );
  }
};

/**
 * Câu 4 – Thêm liên hệ mới vào bảng contacts
 */
export const createContact = async (data: {
  name: string;
  phone?: string | null;
  email?: string | null;
}) => {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `
      INSERT INTO contacts (name, phone, email, favorite, created_at)
      VALUES (?, ?, ?, ?, ?);
    `,
    [
      data.name.trim(),
      data.phone?.trim() || null,
      data.email?.trim() || null,
      0, // mặc định chưa favorite
      now,
    ]
  );
};

/**
 * Câu 5 – Toggle favorite 0 <-> 1
 */
export const toggleFavorite = async (id: number, currentFavorite: number) => {
  const db = await getDb();
  const next = currentFavorite === 1 ? 0 : 1;

  await db.runAsync(
    "UPDATE contacts SET favorite = ? WHERE id = ?;",
    [next, id]
  );
};