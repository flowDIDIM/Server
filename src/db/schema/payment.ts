import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { applicationTable } from "@/db/schema/application";
import { userTable } from "@/db/schema/auth";
import { createdTimestamp, textCuid, updatedTimestamp } from "@/lib/db-column";

export const paymentTable = sqliteTable("payment", {
  id: textCuid().primaryKey(),
  applicationId: text()
    .notNull()
    .references(() => applicationTable.id, { onDelete: "cascade" }),
  developerId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  amount: integer().notNull(),
  status: text().notNull(),
  paidAt: createdTimestamp(),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export type Payment = typeof paymentTable.$inferSelect;
export type NewPayment = typeof paymentTable.$inferInsert;

export const PaymentSchema = createSelectSchema(paymentTable);
export const NewPaymentSchema = createInsertSchema(paymentTable);

export const paymentRelations = relations(paymentTable, ({ one }) => ({
  application: one(applicationTable, {
    fields: [paymentTable.applicationId],
    references: [applicationTable.id],
  }),
  developer: one(userTable, {
    fields: [paymentTable.developerId],
    references: [userTable.id],
  }),
}));
