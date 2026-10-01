import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const results=pgTable("results",{
 id:serial("id").primaryKey(),
 name:text("name").notNull(),
 email:text("email").notNull(),
 wpm:integer("wpm").notNull(),
 accuracy:integer("accuracy").notNull(),
 infractions:integer("infractions").notNull(),
 plates:integer("plates").notNull(),
 windows:integer("windows").notNull(),
 overall:integer("overall").notNull(),
 status:text("status").notNull(),
 practicalAnswers:text("practical_answers").notNull().default("[]"),
 responseDetails:text("response_details").notNull().default("{}"),
 createdAt:timestamp("created_at",{mode:"string",withTimezone:true}).notNull().defaultNow()
});

export const questionSettings=pgTable("question_settings",{
 id:integer("id").primaryKey(),
 questions:text("questions").notNull(),
 updatedAt:timestamp("updated_at",{mode:"string",withTimezone:true}).notNull().defaultNow()
});

export const adminUsers=pgTable("admin_users",{
 id:serial("id").primaryKey(),
 name:text("name").notNull(),
 email:text("email").notNull().unique(),
 passwordHash:text("password_hash").notNull(),
 passwordSalt:text("password_salt").notNull(),
 mustChangePassword:boolean("must_change_password").notNull().default(true),
 isActive:boolean("is_active").notNull().default(true),
 createdAt:timestamp("created_at",{mode:"string",withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{mode:"string",withTimezone:true}).notNull().defaultNow()
});

export const adminSessions=pgTable("admin_sessions",{
 tokenHash:text("token_hash").primaryKey(),
 userId:integer("user_id").notNull().references(()=>adminUsers.id,{onDelete:"cascade"}),
 expiresAt:timestamp("expires_at",{mode:"string",withTimezone:true}).notNull(),
 createdAt:timestamp("created_at",{mode:"string",withTimezone:true}).notNull().defaultNow()
});
