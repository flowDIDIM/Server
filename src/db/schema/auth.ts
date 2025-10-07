import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdTimestamp, updatedTimestamp } from "@/lib/db-column";

export const userTable = sqliteTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).default(false).notNull(),
  image: text(),

  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const sessionTable = sqliteTable("session", {
  id: text().primaryKey(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const accountTable = sqliteTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: integer({
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer({
    mode: "timestamp",
  }),
  scope: text(),
  password: text(),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const verificationTable = sqliteTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});
