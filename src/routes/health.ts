import { Schema } from "effect";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";

const healthRoute = new Hono();

healthRoute.get("/health", describeRoute({
  description: "Check server is healthy",
  responses: {
    200: {
      description: "Successful response",
      content: {
        "text/plain": {
          schema: resolver(Schema.standardSchemaV1(Schema.Struct({
            status: Schema.String,
          }))),
        },
      },
    },
  },
}), (c) => {
  return c.json({
    status: "ok",
  });
});

export default healthRoute;
