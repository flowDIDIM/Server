import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { applicationTable } from "@/db/schema/application";
import { userTable } from "@/db/schema/auth";
import { createdTimestamp, textCuid, updatedTimestamp } from "@/lib/db-column";

export const appTesterTable = sqliteTable("app_tester", {
  id: textCuid().primaryKey(),
  applicationId: text()
    .notNull()
    .references(() => applicationTable.id, { onDelete: "cascade" }),
  testerId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  status: text({ enum: ["active", "dropped"] })
    .notNull()
    .default("active"),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const testHistoryTable = sqliteTable("test_history", {
  id: textCuid().primaryKey(),
  applicationId: text()
    .notNull()
    .references(() => applicationTable.id, { onDelete: "cascade" }),
  testerId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  testedAt: createdTimestamp(),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const appTestConfigTable = sqliteTable("app_test_config", {
  id: textCuid().primaryKey(),
  applicationId: text()
    .notNull()
    .references(() => applicationTable.id, { onDelete: "cascade" })
    .unique(),

  status: text({ enum: ["in_progress", "completed"] })
    .notNull()
    .default("in_progress"),
  requiredDays: integer().notNull().default(14),
  requiredTesters: integer().notNull().default(20),
  startedAt: createdTimestamp(),
  endedAt: integer({ mode: "timestamp" }),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export type AppTester = typeof appTesterTable.$inferSelect;
export type NewAppTester = typeof appTesterTable.$inferInsert;

export type Test = typeof testHistoryTable.$inferSelect;
export type NewTestHistory = typeof testHistoryTable.$inferInsert;

export type AppTestConfig = typeof appTestConfigTable.$inferSelect;
export type NewAppTestConfig = typeof appTestConfigTable.$inferInsert;

export const AppTesterSchema = createSelectSchema(appTesterTable);
export const NewAppTesterSchema = createInsertSchema(appTesterTable);

export const TestHistorySchema = createSelectSchema(testHistoryTable);
export const NewTestHistorySchema = createInsertSchema(testHistoryTable);

export const AppTestConfigSchema = createSelectSchema(appTestConfigTable);
export const NewAppTestConfigSchema = createInsertSchema(appTestConfigTable);

export const appTesterRelations = relations(appTesterTable, ({ one }) => ({
  application: one(applicationTable, {
    fields: [appTesterTable.applicationId],
    references: [applicationTable.id],
  }),
  tester: one(userTable, {
    fields: [appTesterTable.testerId],
    references: [userTable.id],
  }),
}));

export const testHistoryRelations = relations(testHistoryTable, ({ one }) => ({
  application: one(applicationTable, {
    fields: [testHistoryTable.applicationId],
    references: [applicationTable.id],
  }),
  tester: one(userTable, {
    fields: [testHistoryTable.testerId],
    references: [userTable.id],
  }),
}));

export const appTestConfigRelations = relations(
  appTestConfigTable,
  ({ one }) => ({
    application: one(applicationTable, {
      fields: [appTestConfigTable.applicationId],
      references: [applicationTable.id],
    }),
  }),
);
