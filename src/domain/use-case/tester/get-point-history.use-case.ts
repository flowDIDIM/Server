import { desc, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { pointHistoryTable } from "@/db/schema/point";
import { mapHttpError } from "@/lib/effect";

export const getPointHistoryUseCase = Effect.fn("getPointHistoryUseCase")(
  function* (userId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(async () => {
      const history = await db.query.pointHistoryTable.findMany({
        where: eq(pointHistoryTable.userId, userId),
        with: {
          application: true,
        },
        orderBy: [desc(pointHistoryTable.createdAt)],
      });

      return history.map(item => ({
        id: item.id,
        amount: item.amount,
        reason: item.reason,
        balance: item.balance,
        applicationName: item.application?.name,
        createdAt: item.createdAt,
      }));
    }).pipe(mapHttpError);
  },
);
