import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { paymentTable } from "@/db/schema/payment";

export const getPaymentHistoryUseCase = Effect.fn("getPaymentHistoryUseCase")(
  function* (developerId: string) {
    const db = yield* DatabaseService;

    const payments = yield* Effect.tryPromise(() =>
      db.query.paymentTable.findMany({
        where: eq(paymentTable.developerId, developerId),
        columns: {
          amount: true,
          paidAt: true,
        },
        with: {
          application: {
            columns: {
              name: true,
            },
          },
        },
        orderBy: (payment, { desc }) => [desc(payment.paidAt)],
      }),
    );

    return payments.map(payment => ({
      appName: payment.application.name,
      amount: payment.amount,
      paidAt: payment.paidAt,
    }));
  },
);
