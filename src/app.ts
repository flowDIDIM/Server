import { Hono } from "hono";

import healthRoute from "@/routes/health";
import { makeOpenApiRoute } from "@/routes/openapi";
import scalarRoute from "@/routes/scalar";
import "@/lib/env";

const app = new Hono();

app.route("/", healthRoute);
app.route("/", scalarRoute);
app.route("/", makeOpenApiRoute(app));

export default app;
