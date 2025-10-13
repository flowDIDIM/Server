import { Effect } from "effect";
import { and, desc, eq } from "drizzle-orm";

import type { PaymentWebhook } from "@/domain/schema/payment-webhook";
import { DatabaseService } from "@/db";
import { HttpError } from "@/domain/error/http-error";
import { applicationTable, userTable, webhookHistoryTable } from "@/db/schema";
import { mapHttpError } from "@/lib/effect";

export const processPaymentWebhookUseCase = (webhook: PaymentWebhook) => {
  return Effect.gen(function* () {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(() =>
      db.transaction(async tx => {
        // Save webhook to history first
        await tx.insert(webhookHistoryTable).values({ payload: webhook });

        // Only process NORMAL_PAYMENT type
        if (webhook.type !== "NORMAL_PAYMENT") {
          return {
            success: true,
            message: "Webhook saved but not processed (not NORMAL_PAYMENT)",
          };
        }

        // Find user by email
        const user = await tx.query.userTable.findFirst({
          where: eq(userTable.email, webhook.payment.email),
        });

        if (!user) {
          throw new HttpError(
            404,
            `User not found with email: ${webhook.payment.email}`,
          );
        }

        // Find most recent pending application for this user
        const application = await tx.query.applicationTable.findFirst({
          where: and(
            eq(applicationTable.developerId, user.id),
            eq(applicationTable.paymentStatus, "PENDING"),
          ),
          orderBy: desc(applicationTable.createdAt),
        });

        if (!application) {
          throw new HttpError(
            404,
            `No pending application found for user: ${webhook.payment.email}`,
          );
        }

        // Update application payment status based on webhook status
        const newPaymentStatus =
          webhook.payment.status === "SUCCESS" ? "COMPLETED" : "CANCELED";

        await tx
          .update(applicationTable)
          .set({
            paymentStatus: newPaymentStatus,
          })
          .where(eq(applicationTable.id, application.id));

        return {
          success: true,
          message: `Application payment status updated to ${newPaymentStatus}`,
          applicationId: application.id,
          paymentStatus: newPaymentStatus,
        };
      }),
    ).pipe(mapHttpError);
  });
};
