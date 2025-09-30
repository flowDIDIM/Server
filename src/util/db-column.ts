import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const textCuid = () => text().$defaultFn(() => createId());

export function createdTimestamp() {
  return integer({ mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull();
}

export function updatedTimestamp() {
  return integer({ mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull();
}
