import { Effect, Either } from "effect";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";

import { ApplicationSchema, NewApplicationSchema } from "@/db/schema";
import { createAppUseCase } from "@/domain/use-case/developer/app/create-app.use-case";
import { deleteAppUseCase } from "@/domain/use-case/developer/app/delete-app.use-case";
import { getAppsUseCase } from "@/domain/use-case/developer/app/get-apps.use-case";
import { patchAppUseCase } from "@/domain/use-case/developer/app/patch-app-use.case";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";

const appRoute = createApp();

appRoute.get("/", describeRoute({
  description: "개발자가 등록한 모든 앱을 가져옵니다.",
  responses: {
    200: {
      description: "성공적으로 앱 목록을 가져옴",
      content: {
        "application/json": {
          schema: resolver(ApplicationSchema.array()),
        },
      },
    },
    401: {
      description: "인증 실패",
    },
    500: {
      description: "서버 오류",
    },
  },
}), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const result = await getAppsUseCase(user.id)
    .pipe(Effect.either, runAsApp);

  if (Either.isLeft(result)) {
    return c.json({ message: "Failed to get applications" }, 500);
  }

  return c.json({
    apps: result.right,
  });
});

appRoute.post("/", describeRoute({
  description: "앱을 등록합니다.",
  responses: {
    200: {
      description: "성공적으로 앱을 등록함",
      content: {
        "application/json": {
          schema: resolver(ApplicationSchema),
        },
      },
    },
    401: {
      description: "인증 실패",
    },
    500: {
      description: "서버 오류",
    },
  },

}), validator("json", NewApplicationSchema.extend({
  images: z.url().array().optional().default([]),
})), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const input = c.req.valid("json");

  const result = await createAppUseCase(input)
    .pipe(Effect.either, runAsApp);

  if (Either.isLeft(result)) {
    return c.json({ message: "Failed to get applications" }, 500);
  }

  return c.json(result.right);
});

appRoute.patch("/:id", describeRoute({
  description: "앱을 수정합니다.",
  responses: {
    200: {
      description: "성공적으로 앱을 수정함",
      content: {
        "application/json": {
          schema: resolver(ApplicationSchema),
        },
      },
    },
    401: {
      description: "인증 실패",
    },
    500: {
      description: "서버 오류",
    },
  },

}), validator("json", NewApplicationSchema
  .extend({
    images: z.url().array().optional().default([]),
  })
  .partial()
  .omit({ id: true })), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const applicationId = c.req.param("id");
  const input = c.req.valid("json");

  const result = await patchAppUseCase(applicationId, input)
    .pipe(Effect.either, runAsApp);

  if (Either.isLeft(result)) {
    return c.json({ message: "Failed to patch applications" }, 500);
  }

  return c.json(result.right);
});

appRoute.delete("/:id", describeRoute({
  description: "앱을 삭제합니다.",
  responses: {
    200: {
      description: "성공적으로 앱을 삭제함",
      content: {
        "application/json": {
          schema: resolver(z.object({
            success: z.boolean(),
          })),
        },
      },
    },
    401: {
      description: "인증 실패",
    },
    500: {
      description: "서버 오류",
    },
  },
}), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const applicationId = c.req.param("id");

  const result = await deleteAppUseCase(applicationId)
    .pipe(Effect.either, runAsApp);

  if (Either.isLeft(result)) {
    return c.json({ message: "Failed to delete application" }, 500);
  }

  return c.json(result.right);
});

export default appRoute;
