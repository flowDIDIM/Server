import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { applicationTable } from "@/db/schema/application";
import { userTable } from "@/db/schema/auth";
import { createdTimestamp, textCuid, updatedTimestamp } from "@/lib/db-column";

export const testerTable = sqliteTable(
  "tester",
  {
    id: textCuid().primaryKey(),
    applicationId: text()
      .notNull()
      .references(() => applicationTable.id, { onDelete: "cascade" }),
    testerId: text()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    status: text({ enum: ["active", "completed", "dropped"] })
      .notNull()
      .default("active"),

    earnedPoints: integer("earned_points").notNull().default(0),

    createdAt: createdTimestamp(),
    updatedAt: updatedTimestamp(),
  },
  // 한 테스터가 같은 애플리케이션에 여러 번 등록하지 못하도록 unique 제약 조건 추가
  table => [unique().on(table.applicationId, table.testerId)],
);

export const testLogTable = sqliteTable(
  "test_log",
  {
    id: textCuid().primaryKey(),
    applicationId: text()
      .notNull()
      .references(() => applicationTable.id, { onDelete: "cascade" }),
    testerId: text()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    // YYYY-MM-DD 형식
    testedAt: text().notNull(),
  },
  // 한 테스터가 같은 애플리케이션에 같은 날짜에 여러 번 테스트 기록을 남기지 못하도록 unique 제약 조건 추가
  table => [unique().on(table.applicationId, table.testerId, table.testedAt)],
);

export type Tester = typeof testerTable.$inferSelect;
export type NewTester = typeof testerTable.$inferInsert;

export type TestLog = typeof testLogTable.$inferSelect;
export type NewTestHistory = typeof testLogTable.$inferInsert;

export const testerRelations = relations(testerTable, ({ one }) => ({
  application: one(applicationTable, {
    fields: [testerTable.applicationId],
    references: [applicationTable.id],
  }),
  tester: one(userTable, {
    fields: [testerTable.testerId],
    references: [userTable.id],
  }),
}));

export const testLogRelations = relations(testLogTable, ({ one }) => ({
  application: one(applicationTable, {
    fields: [testLogTable.applicationId],
    references: [applicationTable.id],
  }),
  tester: one(userTable, {
    fields: [testLogTable.testerId],
    references: [userTable.id],
  }),
}));
