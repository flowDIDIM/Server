import "@/lib/env";

import type { Session, User } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { createApp } from "@/lib/create-app";
import developerRoute from "@/routes/developer";
import healthRoute from "@/routes/health";
import { authCors } from "@/lib/middleware/auth";
import { handleHonoError } from "@/lib/error-handler";

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
  .onError(handleHonoError);

export default app;

export type AppType = typeof app;
