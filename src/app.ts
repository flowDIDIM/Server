import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import { makeOpenApiRoute } from "@/routes/openapi";
import scalarRoute from "@/routes/scalar";

const app = new Hono();

app.get("/health", describeRoute({
  description: "Say hello to the user",
  responses: {
    200: {
      description: "Successful response",
      content: {
      },
    },
  },
}), (c) => {
  return c.text("OK");
});

app.route("/scalar", scalarRoute);
app.route("/openapi", makeOpenApiRoute(app));

export default app;
