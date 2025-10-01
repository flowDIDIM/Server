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
          title: "DIDIM API",
          description: "DIDIM 백엔드의 API 명세서입니다",
          version: "0.0.1",
        },
        servers: [
          { url: "http://localhost:3000", description: "Local Server" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    }),
  );

  return route;
}
