import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { userTable } from "@/db/schema/auth";
import { createdTimestamp, textCuid, updatedTimestamp } from "@/lib/db-column";

export const gifticonProductTable = sqliteTable("gifticon_product", {
  id: textCuid().primaryKey(),
  name: text().notNull(),
  description: text(),
  price: integer().notNull(),
  imageUrl: text(),
  category: text(),
  isAvailable: integer({ mode: "boolean" }).notNull().default(true),

  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const gifticonPurchaseTable = sqliteTable("gifticon_purchase", {
  id: textCuid().primaryKey(),
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  productId: text()
    .notNull()
    .references(() => gifticonProductTable.id, { onDelete: "cascade" }),

  price: integer().notNull(),
  status: text({ enum: ["pending", "completed", "used"] })
    .notNull()
    .default("pending"),
  code: text(),
  expiresAt: integer({ mode: "timestamp" }),

  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export type GifticonProduct = typeof gifticonProductTable.$inferSelect;
export type NewGifticonProduct = typeof gifticonProductTable.$inferInsert;

export type GifticonPurchase = typeof gifticonPurchaseTable.$inferSelect;
export type NewGifticonPurchase = typeof gifticonPurchaseTable.$inferInsert;

export const GifticonProductSchema = createSelectSchema(gifticonProductTable);
export const NewGifticonProductSchema =
  createInsertSchema(gifticonProductTable);

export const GifticonPurchaseSchema = createSelectSchema(gifticonPurchaseTable);
export const NewGifticonPurchaseSchema = createInsertSchema(
  gifticonPurchaseTable,
);

export const gifticonProductRelations = relations(
  gifticonProductTable,
  ({ many }) => ({
    purchases: many(gifticonPurchaseTable),
  }),
);

export const gifticonPurchaseRelations = relations(
  gifticonPurchaseTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [gifticonPurchaseTable.userId],
      references: [userTable.id],
    }),
    product: one(gifticonProductTable, {
      fields: [gifticonPurchaseTable.productId],
      references: [gifticonProductTable.id],
    }),
  }),
);
