import type { ContentfulStatusCode } from "hono/utils/http-status";

import { Effect, Either } from "effect";
import { validator } from "hono-openapi";
import { z } from "zod";

import { NewApplicationWithImageSchema } from "@/db/schema";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";
import { HttpError } from "@/domain/error/http-error";
import { createAppUseCase } from "@/domain/use-case/developer/app/create-app.use-case";
import { createAppCompletedUseCase } from "@/domain/use-case/developer/app/create-app-completed.use-case";
import { PaymentWebhookSchema } from "@/domain/schema/payment-webhook";
import { processPaymentWebhookUseCase } from "@/domain/use-case/developer/payment/process-payment-webhook.use-case";
import { env } from "@/lib/env";

const PAYMENT_URL_MAP: Record<number, string> = {
  10000: "https://www.latpeed.com/products/q6y7N/pay",
  30000: "https://www.latpeed.com/products/fdCxB/pay",
  50000: "https://www.latpeed.com/products/KgIn2/pay",
  100000: "https://www.latpeed.com/products/O7sfW/pay",
};

const paymentRoute = createApp()
  .post(
    "/create",
    validator(
      "json",
      z.object({
        application: NewApplicationWithImageSchema,
        amount: z.number(),
      }),
    ),
    async c => {
      const user = c.get("user");
      if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const input = c.req.valid("json");

      // Demo mode: create application with COMPLETED payment status
      if (env.PAYMENT_DEMO) {
        const createResult = await createAppCompletedUseCase({
          ...input.application,
          developerId: user.id,
        }).pipe(Effect.either, runAsApp);

        if (Either.isLeft(createResult)) {
          return c.json(
            { message: createResult.left.message },
            createResult.left instanceof HttpError
              ? (createResult.left.status as ContentfulStatusCode)
              : 500,
          );
        }

        return c.json({
          applicationId: createResult.right.id,
          paymentStatus: "COMPLETED",
          demo: true,
        });
      }

      // Create application with PENDING payment status (default)
      const createResult = await createAppUseCase({
        ...input.application,
        developerId: user.id,
      }).pipe(Effect.either, runAsApp);

      if (Either.isLeft(createResult)) {
        return c.json(
          { message: createResult.left.message },
          createResult.left instanceof HttpError
            ? (createResult.left.status as ContentfulStatusCode)
            : 500,
        );
      }

      const application = createResult.right;

      if (
        Object.keys(PAYMENT_URL_MAP).indexOf(input.amount.toString()) === -1
      ) {
        return c.json(
          {
            message: `Invalid payment amount. Available presets: ${Object.keys(PAYMENT_URL_MAP).join(", ")}`,
          },
          400,
        );
      }

      // Return preset payment URL based on amount
      const paymentUrl = PAYMENT_URL_MAP[input.amount];

      return c.json({
        applicationId: application.id,
        paymentUrl,
        amount: input.amount,
      });
    },
  )

  .post("/webhook", validator("json", PaymentWebhookSchema), async c => {
    const webhook = c.req.valid("json");

    const result = await processPaymentWebhookUseCase(webhook).pipe(
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
  });

export default paymentRoute;
