import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";

const healthRoute = new Hono();

healthRoute.get("/health", describeRoute({
  description: "Check server is healthy",
  responses: {
    200: {
      description: "Successful response",
      content: {
        "text/plain": {
          schema: resolver(z.object({
            status: z.literal("ok"),
          })),
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
