import { Hono } from "hono";
import { logger } from "hono/logger";

import type { Session, User } from "@/lib/auth";

import "@/lib/env";
import { auth } from "@/lib/auth";
import { authCors, authMiddleware } from "@/middleware/auth";
import healthRoute from "@/routes/health";
import { makeOpenApiRoute } from "@/routes/openapi";
import scalarRoute from "@/routes/scalar";

export interface AppType {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}

const app = new Hono<AppType>();

app.use(logger());
app.use("*", authMiddleware);
app.use(
  "/api/auth/*",
  authCors,
);

app.route("/", healthRoute);
app.route("/", scalarRoute);
app.route("/", makeOpenApiRoute(app));

app.on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw));

app.get("/session", (c) => {
  const session = c.get("session");
  const user = c.get("user");

  if (!user)
    return c.body(null, 401);

  return c.json({
    session,
    user,
  });
});

export default app;
