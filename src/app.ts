import { Hono } from "hono";

import type { Session, User } from "@/lib/auth";

import { auth } from "@/lib/auth";
import { authCors, authMiddleware } from "@/middleware/auth";
import "@/lib/env";
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

app.use("*", authMiddleware);
app.use(
  "/api/auth/*",
  authCors,
);

app.route("/", healthRoute);
app.route("/", scalarRoute);
app.route("/", makeOpenApiRoute(app));

app.on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw));

export default app;
