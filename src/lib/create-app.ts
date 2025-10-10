import { Hono } from "hono";
import { logger } from "hono/logger";

import { authMiddleware } from "@/lib/middleware/auth";

export function createApp() {
  return new Hono().use(logger()).use("*", authMiddleware);
}
