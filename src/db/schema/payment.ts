import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { applicationTable } from "@/db/schema/application";
import { userTable } from "@/db/schema/auth";
import { createdTimestamp, textCuid, updatedTimestamp } from "@/lib/db-column";
import { PaymentStatusValueList } from "@/domain/schema/payment/payment-status";

export const paymentHistoryTable = sqliteTable("payment_history", {
  id: textCuid().primaryKey(),
  payAppId: text().notNull(),
  applicationId: text()
    .notNull()
    .references(() => applicationTable.id, { onDelete: "cascade" }),
  developerId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  amount: integer().notNull(),

  paymentState: text({ enum: PaymentStatusValueList })
    .notNull()
    .default("결제완료"),

  requestAt: integer().notNull(),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const paymentRelations = relations(paymentHistoryTable, ({ one }) => ({
  application: one(applicationTable, {
    fields: [paymentHistoryTable.applicationId],
    references: [applicationTable.id],
  }),
  developer: one(userTable, {
    fields: [paymentHistoryTable.developerId],
    references: [userTable.id],
  }),
}));
