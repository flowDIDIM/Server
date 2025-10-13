import { validator } from "hono-openapi";
import { z } from "zod";

import { NewApplicationWithImageSchema } from "@/db/schema";
import { createApp } from "@/lib/create-app";
import { runAsApp } from "@/lib/runtime";
import { createAppUseCase } from "@/domain/use-case/developer/app/create-app.use-case";
import { createAppCompletedUseCase } from "@/domain/use-case/developer/app/create-app-completed.use-case";
import { PaymentWebhookSchema } from "@/domain/schema/payment-webhook";
import { processPaymentWebhookUseCase } from "@/domain/use-case/developer/payment/process-payment-webhook.use-case";
import { env } from "@/lib/env";
import { HttpError } from "@/domain/error/http-error";

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
        const application = await runAsApp(
          createAppCompletedUseCase({
            ...input.application,
            developerId: user.id,
          }),
        );

        return c.json({
          applicationId: application.id,
          paymentStatus: "COMPLETED",
          demo: true,
        });
      }

      // Create application with PENDING payment status (default)
      const application = await createAppUseCase({
        ...input.application,
        developerId: user.id,
      }).pipe(runAsApp);

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

    const result = await runAsApp(processPaymentWebhookUseCase(webhook));

    return c.json(result);
  });

export default paymentRoute;
