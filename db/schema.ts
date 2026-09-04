import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), email: text("email").notNull(),
  wpm: integer("wpm").notNull(), accuracy: integer("accuracy").notNull(),
  infractions: integer("infractions").notNull(), plates: integer("plates").notNull(),
  windows: integer("windows").notNull(), overall: integer("overall").notNull(),
  status: text("status").notNull(), practicalAnswers: text("practical_answers").notNull().default("[]"),
  responseDetails: text("response_details").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
export const questionSettings = sqliteTable("question_settings", {
  id: integer("id").primaryKey(),
  questions: text("questions").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});


export const adminUsers = sqliteTable("admin_users", {
 id: integer("id").primaryKey({ autoIncrement: true }),
 name: text("name").notNull(),
 email: text("email").notNull().unique(),
 passwordHash: text("password_hash").notNull(),
 passwordSalt: text("password_salt").notNull(),
 mustChangePassword: integer("must_change_password").notNull().default(1),
 isActive: integer("is_active").notNull().default(1),
 createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
 updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const adminSessions = sqliteTable("admin_sessions", {
 tokenHash: text("token_hash").primaryKey(),
 userId: integer("user_id").notNull(),
 expiresAt: text("expires_at").notNull(),
 createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
