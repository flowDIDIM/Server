import "@/lib/env";

import type { Session, User } from "@/lib/auth";

import { auth } from "@/lib/auth";
import { createApp } from "@/lib/create-app";
import developerRoute from "@/routes/developer";
import healthRoute from "@/routes/health";
import { makeOpenApiRoute } from "@/routes/openapi";
import scalarRoute from "@/routes/scalar";

export interface AppType {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}

const app = createApp();
app.route("/", scalarRoute);
app.route("/", makeOpenApiRoute(app));
app.on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw));

app.route("/", healthRoute);
app.route("/developer", developerRoute);

export default app;
