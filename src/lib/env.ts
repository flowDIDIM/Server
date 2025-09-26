import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    DB_FILE_NAME: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    KAKAO_CLIENT_ID: z.string(),
    KAKAO_CLIENT_SECRET: z.string(),

    NAVER_CLIENT_ID: z.string(),
    NAVER_CLIENT_SECRET: z.string(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
