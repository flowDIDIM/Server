import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { mapHttpError } from "@/lib/effect";

export const getPaymentHistoryUseCase = Effect.fn("getPaymentHistoryUseCase")(
  function* (developerId: string) {
    const db = yield* DatabaseService;
    return yield* Effect.tryPromise(() =>
      db.transaction(async tx =>
        tx.query.applicationTable.findMany({
          where: and(
            eq(applicationTable.developerId, developerId),
            eq(applicationTable.paymentStatus, "COMPLETED"),
          ),
          columns: {
            id: true,
            name: true,
            createdAt: true,
            price: true,
          },
          orderBy: (applicationTable, { desc }) => [
            desc(applicationTable.createdAt),
          ],
        }),
      ),
    ).pipe(mapHttpError);
  },
);
