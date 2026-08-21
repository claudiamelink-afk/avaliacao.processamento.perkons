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
