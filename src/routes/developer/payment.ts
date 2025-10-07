import type { ContentfulStatusCode } from "hono/utils/http-status";

import { Effect, Either } from "effect";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";

import { ApplicationSchema, NewApplicationSchema } from "@/db/schema";
import { validatePayappFeedbackUseCase } from "@/domain/use-case/developer/payment/validate-payapp-feedback.use-case";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";
import {
  createPayUrlUseCase,
  type CreatePayUrlUseCaseInput,
  CreatePayUrlUseCaseInputSchema,
} from "@/domain/use-case/developer/payment/create-payurl.use-case";
import { HttpError } from "@/domain/error/http-error";

const paymentRoute = createApp();

paymentRoute.post(
  "/create",
  describeRoute({
    description: "앱을 등록하고 결제 URL을 생성합니다.",
    responses: {
      200: {
        description: "결제 URL 생성 성공",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                url: z.url(),
              }),
            ),
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
  }),
  validator("json", CreatePayUrlUseCaseInputSchema),
  async c => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const input = c.req.valid("json");

    const result = await createPayUrlUseCase(input).pipe(
      Effect.either,
      runAsApp,
    );

    if (Either.isLeft(result)) {
      return c.json(
        { message: result.left.message },
        result.left instanceof HttpError
          ? (result.left.status as ContentfulStatusCode)
          : 500,
      );
    }

    return c.json(result.right);
  },
);

paymentRoute.post("/feedback", async c => {
  const body = await c.req.parseBody();
  const data = Object.fromEntries(
    Object.entries(body).map(([k, v]) => [k, String(v)]),
  );

  // const result = await validatePayappFeedbackUseCase(data).pipe(
  //   Effect.either,
  //   runAsApp,
  // );
  //
  // if (Either.isLeft(result)) {
  //   return c.json(
  //     { message: result.left.message },
  //     result.left.status as ContentfulStatusCode,
  //   );
  // }
  //
  // const feedbackData = result.right;
});

export default paymentRoute;
