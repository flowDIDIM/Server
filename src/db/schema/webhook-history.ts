import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { createdTimestamp, textCuid } from "@/lib/db-column";

export const webhookHistoryTable = sqliteTable("webhook_history", {
  id: textCuid().primaryKey(),

  payload: text({ mode: "json" }).notNull(),

  createdAt: createdTimestamp(),
});

export type WebhookHistory = typeof webhookHistoryTable.$inferSelect;
export type NewWebhookHistory = typeof webhookHistoryTable.$inferInsert;

export const WebhookHistorySchema = createSelectSchema(webhookHistoryTable);
export const NewWebhookHistorySchema = createInsertSchema(webhookHistoryTable);
