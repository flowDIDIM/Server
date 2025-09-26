import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";

import type { AppType } from "@/app";

export function makeOpenApiRoute(hono: Hono<AppType>) {
  const route = new Hono<AppType>();

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
