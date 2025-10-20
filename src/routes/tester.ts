import { validator } from "hono-openapi";
import { z } from "zod";

import { joinAppTestUseCase } from "@/domain/use-case/tester/join-app-test.use-case";
import { recordTestLogUseCase } from "@/domain/use-case/tester/record-test-log.use-case";
import { getMyAppsUseCase } from "@/domain/use-case/tester/get-my-apps.use-case";
import { getRecruitingAppsUseCase } from "@/domain/use-case/tester/get-recruiting-apps.use-case";
import { getNewestAppsUseCase } from "@/domain/use-case/tester/get-newest-apps.use-case";
import { getAlmostFullAppsUseCase } from "@/domain/use-case/tester/get-almost-full-apps.use-case";
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
  )
  .get("/my-apps", async c => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const result = await getMyAppsUseCase(user.id).pipe(runAsApp);

    return c.json(result);
  })
  .get(
    "/apps",
    validator(
      "query",
      z.object({
        page: z.string().transform(Number).default(1),
        pageSize: z.string().transform(Number).default(10),
      }),
    ),
    async c => {
      const { page, pageSize } = c.req.valid("query");

      const result = await getRecruitingAppsUseCase(page, pageSize).pipe(
        runAsApp,
      );

      return c.json(result);
    },
  )
  .get("/apps/newest", async c => {
    const result = await getNewestAppsUseCase().pipe(runAsApp);

    return c.json(result);
  })
  .get("/apps/almost-full", async c => {
    const result = await getAlmostFullAppsUseCase().pipe(runAsApp);

    return c.json(result);
  });

export default testerRoute;
