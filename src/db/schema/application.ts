import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { userTable } from "@/db/schema/auth";
import { createdTimestamp, textCuid, updatedTimestamp } from "@/lib/db-column";

export const applicationTable = sqliteTable("application", {
  id: textCuid().primaryKey(),
  developerId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  name: text().notNull(),
  shortDescription: text().notNull(),
  fullDescription: text().notNull(),
  icon: text().notNull(),
  packageName: text().notNull().unique(),
  trackName: text().notNull(),

  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export const applicationImageTable = sqliteTable("application_image", {
  id: textCuid().primaryKey(),
  url: text().notNull(),
  applicationId: text()
    .notNull()
    .references(() => applicationTable.id, { onDelete: "cascade" }),
  createdAt: createdTimestamp(),
  updatedAt: updatedTimestamp(),
});

export type Application = typeof applicationTable.$inferSelect;
export type NewApplication = typeof applicationTable.$inferInsert;

export const ApplicationSchema = createSelectSchema(applicationTable);
export const NewApplicationSchema = createInsertSchema(applicationTable);

export const ApplicationImageSchema = createSelectSchema(applicationImageTable);
export const NewApplicationImageSchema = createInsertSchema(applicationImageTable);

export const applicationRelations = relations(applicationTable, ({ one, many }) => ({
  developer: one(userTable, {
    fields: [applicationTable.developerId],
    references: [userTable.id],
  }),
  images: many(applicationImageTable),
}));

export const applicationImageRelations = relations(applicationImageTable, ({ one }) => ({
  application: one(applicationTable, {
    fields: [applicationImageTable.applicationId],
    references: [applicationTable.id],
  }),
}));
