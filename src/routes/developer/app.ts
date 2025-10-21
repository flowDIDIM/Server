import { validator } from "hono-openapi";
import { z } from "zod";

import { NewApplicationSchema } from "@/db/schema";
import { deleteAppUseCase } from "@/domain/use-case/developer/app/delete-app.use-case";
import { getAppsUseCase } from "@/domain/use-case/developer/app/get-apps.use-case";
import { getAppTestStatusUseCase } from "@/domain/use-case/developer/app/get-app-test-status.use-case";
import { patchAppUseCase } from "@/domain/use-case/developer/app/patch-app.use-case";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";

const appRoute = createApp()
  .get("/", async c => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await getAppsUseCase(user.id).pipe(runAsApp);

    if ("error" in result) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({
      apps: result,
    });
  })
  .get("/:id", async c => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const applicationId = c.req.param("id");

    const result = await getAppTestStatusUseCase(applicationId, user.id).pipe(
      runAsApp,
    );

    if ("error" in result) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result);
  })
  .patch(
    "/:id",
    validator(
      "json",
      NewApplicationSchema.extend({
        images: z.url().array().optional().default([]),
      })
        .partial()
        .omit({ id: true }),
    ),
    async c => {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      const applicationId = c.req.param("id");
      const input = c.req.valid("json");

      const result = await patchAppUseCase(applicationId, user.id, input).pipe(
        runAsApp,
      );

      if ("error" in result) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result);
    },
  )
  .delete("/:id", async c => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const applicationId = c.req.param("id");

    const result = await deleteAppUseCase(applicationId, user.id).pipe(
      runAsApp,
    );

    if ("error" in result) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result);
  });

export default appRoute;
