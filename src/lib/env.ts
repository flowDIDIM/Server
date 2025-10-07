import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SERVER_URL: z.string(),

    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    DB_FILE_NAME: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    KAKAO_CLIENT_ID: z.string(),
    KAKAO_CLIENT_SECRET: z.string(),

    NAVER_CLIENT_ID: z.string(),
    NAVER_CLIENT_SECRET: z.string(),

    PAYAPP_URL: z.string().default("https://api.payapp.kr"),
    PAYAPP_USER_ID: z.string(),
    PAYAPP_LINK_KEY: z.string(),
    PAYAPP_LINK_VALUE: z.string(),

    MINIMUM_PAYMENT_AMOUNT: z.coerce.number().default(10000),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
