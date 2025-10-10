import type { ContentfulStatusCode } from "hono/utils/http-status";

import { Effect, Either } from "effect";
import { validator } from "hono-openapi";
import { z } from "zod";

import { NewApplicationWithImageSchema } from "@/db/schema";
import { validatePayappFeedbackUseCase } from "@/domain/use-case/developer/payment/validate-payapp-feedback.use-case";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";
import { createPayUrlUseCase } from "@/domain/use-case/developer/payment/create-payurl.use-case";
import { HttpError } from "@/domain/error/http-error";
import { createAppUseCase } from "@/domain/use-case/developer/app/create-app.use-case";
import { getPaymentStatusUseCase } from "@/domain/use-case/developer/payment/get-payment-status.use-case";

const paymentRoute = createApp()
  .post(
    "/create",
    validator(
      "json",
      z.object({
        application: NewApplicationWithImageSchema,
        payment: z.object({
          phoneNumber: z.string(),
          amount: z.number(),
        }),
      }),
    ),
    async c => {
      const user = c.get("user");
      if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const input = c.req.valid("json");

      const createResult = await createAppUseCase(input.application).pipe(
        Effect.either,
        runAsApp,
      );

      if (Either.isLeft(createResult)) {
        return c.json(
          { message: createResult.left.message },
          createResult.left instanceof HttpError
            ? (createResult.left.status as ContentfulStatusCode)
            : 500,
        );
      }

      const { id: applicationId, developerId } = createResult.right;

      const result = await createPayUrlUseCase({
        ...input.payment,
        applicationId,
        developerId,
      }).pipe(Effect.either, runAsApp);

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
  )

  .post("/feedback", async c => {
    const body = await c.req.parseBody();
    const data = Object.fromEntries(
      Object.entries(body)
        .map(([k, v]) => [k, String(v)])
        .filter(([_, v]) => v.length > 0),
    );

    const result = await validatePayappFeedbackUseCase(data).pipe(
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

    return c.json({ ok: true });
  })

  .get("/:paymentId", async c => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const developerId = user.id;
    const paymentId = c.req.param("paymentId");

    const result = await getPaymentStatusUseCase(paymentId, developerId).pipe(
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

    return c.json({ state: result.right });
  });

export default paymentRoute;
