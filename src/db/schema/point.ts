import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { userTable } from "@/db/schema/auth";
import { createdTimestamp, textCuid, updatedTimestamp } from "@/lib/db-column";

export const userPointTable = sqliteTable("user_point", {
  id: textCuid().primaryKey(),
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" })
    .unique(),
  balance: integer().notNull().default(0),

  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const pointHistoryTable = sqliteTable("point_history", {
  id: textCuid().primaryKey(),
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  amount: integer().notNull(),
  type: text({ enum: ["earn", "spend"] }).notNull(),
  reason: text().notNull(),
  balance: integer().notNull(),

  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export type UserPoint = typeof userPointTable.$inferSelect;
export type NewUserPoint = typeof userPointTable.$inferInsert;

export type PointHistory = typeof pointHistoryTable.$inferSelect;
export type NewPointHistory = typeof pointHistoryTable.$inferInsert;

export const UserPointSchema = createSelectSchema(userPointTable);
export const NewUserPointSchema = createInsertSchema(userPointTable);

export const PointHistorySchema = createSelectSchema(pointHistoryTable);
export const NewPointHistorySchema = createInsertSchema(pointHistoryTable);

export const userPointRelations = relations(userPointTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userPointTable.userId],
    references: [userTable.id],
  }),
}));

export const pointHistoryRelations = relations(
  pointHistoryTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [pointHistoryTable.userId],
      references: [userTable.id],
    }),
  }),
);
