import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";

import type { AppType } from "@/app";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

export const authMiddleware = createMiddleware<AppType>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

export const authCors = cors({
  origin: [env.SERVER_URL],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});
