import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";

export function makeOpenApiRoute(hono: Hono) {
  const route = new Hono();

  route.get(
    "/openapi",
    openAPIRouteHandler(hono, {
      documentation: {
        info: {
          title: "Hono API",
          version: "1.0.0",
          description: "Greeting API",
        },
        servers: [
          { url: "http://localhost:3000", description: "Local Server" },
        ],
      },
    }),
  );

  return route;
}
