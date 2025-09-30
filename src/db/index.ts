import { drizzle } from "drizzle-orm/libsql";
import { Effect } from "effect";

import { env } from "@/lib/env";

import * as schema from "./schema";

export const db = drizzle(env.DB_FILE_NAME, {
  schema,
  casing: "snake_case",
});

export type Database = typeof db;
export class DatabaseService extends Effect.Tag("DatabaseService")<DatabaseService, Database>() {}
