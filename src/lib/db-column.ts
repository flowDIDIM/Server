import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const textCuid = () => text().$defaultFn(() => createId());

export function createdTimestamp() {
  return integer({ mode: "timestamp" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull();
}

export function updatedTimestamp() {
  return integer({ mode: "timestamp" })
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date())
    .notNull();
}
