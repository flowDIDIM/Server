import { validator } from "hono-openapi";
import { z } from "zod";

import { joinAppTestUseCase } from "@/domain/use-case/tester/join-app-test.use-case";
import { recordTestLogUseCase } from "@/domain/use-case/tester/record-test-log.use-case";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";

const testerRoute = createApp()
  .post(
    "/join",
    validator(
      "json",
      z.object({
        applicationId: z.string(),
      }),
    ),
    async c => {
      const user = c.get("user");
      if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const { applicationId } = c.req.valid("json");

      const result = await joinAppTestUseCase(applicationId, user.id).pipe(
        runAsApp,
      );

      return c.json(result, 201);
    },
  )
  .post(
    "/record",
    validator(
      "json",
      z.object({
        applicationId: z.string(),
      }),
    ),
    async c => {
      const user = c.get("user");
      if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const { applicationId } = c.req.valid("json");

      const result = await recordTestLogUseCase(applicationId, user.id).pipe(
        runAsApp,
      );

      return c.json(result, 201);
    },
  );

export default testerRoute;
