import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    SERVER_URL: z.string(),

    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    DB_FILE_NAME: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    // Demo mode: skip payment and immediately mark as completed
    PAYMENT_DEMO: z.coerce.boolean().optional().default(false),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
