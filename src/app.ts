import "@/lib/env";

import type { Session, User } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { createApp } from "@/lib/create-app";
import developerRoute from "@/routes/developer";
import healthRoute from "@/routes/health";
import testerRoute from "@/routes/tester";
import { authCors } from "@/lib/middleware/auth";
import { handleHonoError } from "@/lib/error-handler";
import { hc } from "hono/client";

export interface AppEnv {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}

const app = createApp()
  .on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw))
  .use("/api/auth/*", authCors)
  .route("/health", healthRoute)
  .route("/developer", developerRoute)
  .route("/tester", testerRoute)
  .onError(handleHonoError);

export default app;

export type AppType = typeof app;
export type Client = ReturnType<typeof hc<typeof app>>;
export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof app>(...args);
