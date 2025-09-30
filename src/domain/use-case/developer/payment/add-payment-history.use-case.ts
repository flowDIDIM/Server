import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { paymentTable } from "@/db/schema/payment";

interface AddPaymentHistoryInput {
  applicationId: string;
  developerId: string;
  amount: number;
  status: string;
  paidAt?: Date;
}

export const addPaymentHistoryUseCase = Effect.fn("addPaymentHistoryUseCase")(
  function* (input: AddPaymentHistoryInput) {
    const db = yield* DatabaseService;

    const [payment] = yield* Effect.tryPromise(() =>
      db
        .insert(paymentTable)
        .values({
          applicationId: input.applicationId,
          developerId: input.developerId,
          amount: input.amount,
          status: input.status,
          paidAt: input.paidAt,
        })
        .returning(),
    );

    return payment;
  },
);
