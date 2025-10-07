import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { paymentTable } from "@/db/schema/payment";

interface AddPaymentHistoryInput {
  applicationId: string;
  developerId: string;
  amount: number;
  status: string;
  paidAt?: number;
}

export const addPaymentHistoryUseCase = Effect.fn("addPaymentHistoryUseCase")(
  function* (input: AddPaymentHistoryInput) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async tx => {
          const [payment] = await tx
            .insert(paymentTable)
            .values({
              applicationId: input.applicationId,
              developerId: input.developerId,
              amount: input.amount,
              status: input.status,
              paidAt: input.paidAt,
            })
            .returning();

          return payment;
        }),
      catch: error => new DatabaseError("Failed to add payment history", error),
    });
  },
);
