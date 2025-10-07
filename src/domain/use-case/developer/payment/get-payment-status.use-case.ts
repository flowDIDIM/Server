import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { paymentHistoryTable } from "@/db/schema/payment";
import { NotFoundError } from "@/domain/error/not-found-error";
import { mapHttpError } from "@/lib/effect";

export const getPaymentStatusUseCase = Effect.fn("getPaymentStatusUseCase")(
  function* (paymentId: string, developerId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async tx => {
          const payment = await tx.query.paymentHistoryTable.findFirst({
            where: and(
              eq(paymentHistoryTable.developerId, developerId),
              eq(paymentHistoryTable.payAppId, paymentId),
            ),
          });

          if (!payment) {
            throw new NotFoundError("Payment not found");
          }

          return payment.paymentState;
        }),
      catch: error => new DatabaseError("Failed to get payment status", error),
    }).pipe(mapHttpError);
  },
);
