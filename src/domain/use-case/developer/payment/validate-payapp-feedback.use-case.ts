import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable, paymentHistoryTable } from "@/db/schema";
import { BadRequestError } from "@/domain/error/bad-request-error";
import { NotFoundError } from "@/domain/error/not-found-error";
import { UnauthorizedError } from "@/domain/error/unauthorized-error";
import { env } from "@/lib/env";
import { DatabaseError } from "@/domain/error/database-error";
import { FeedbackSchema } from "@/domain/schema/payment/payment-feedback";

export const validatePayappFeedbackUseCase = Effect.fn(
  "validatePayappFeedbackUseCase",
)(function* (input: Record<string, string>) {
  const db = yield* DatabaseService;

  const result = yield* Schema.decodeUnknown(FeedbackSchema)(input).pipe(
    Effect.mapError(
      error => new BadRequestError("Invalid request body", error),
    ),
  );

  if (
    result.linkKey !== env.PAYAPP_LINK_KEY ||
    result.linkValue !== env.PAYAPP_LINK_VALUE
  ) {
    return yield* new UnauthorizedError();
  }

  const application = yield* Effect.tryPromise({
    try: () =>
      db.transaction(async tx =>
        tx.query.applicationTable.findFirst({
          where: eq(applicationTable.id, result.applicationId),
        }),
      ),
    catch: error => new DatabaseError("Failed to get application", error),
  });

  if (!application) {
    // TODO: What if application is not found even if payment was successful?
    return yield* new NotFoundError("Application not found");
  }

  if (application.developerId !== result.developerId) {
    return yield* new UnauthorizedError();
  }

  yield* Effect.tryPromise({
    try: () =>
      db.transaction(async tx => {
        await tx
          .update(applicationTable)
          .set({
            paymentState: result.payState,
          })
          .where(eq(applicationTable.id, result.applicationId));

        await tx.insert(paymentHistoryTable).values({
          payAppId: result.paymentId,
          applicationId: result.applicationId,
          developerId: result.developerId,
          amount: result.price,
          paymentState: result.payState,
          requestAt: result.requestDate.epochMillis,
        });
      }),
    catch: error =>
      new DatabaseError("Failed to update application and payment", error),
  });

  return result;
});
