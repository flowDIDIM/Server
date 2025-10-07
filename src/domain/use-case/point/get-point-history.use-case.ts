import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { pointHistoryTable } from "@/db/schema/point";

export const getPointHistoryUseCase = Effect.fn("getPointHistoryUseCase")(
  function* (userId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async tx => {
          const histories = await tx.query.pointHistoryTable.findMany({
            where: eq(pointHistoryTable.userId, userId),
            orderBy: (history, { desc }) => [desc(history.createdAt)],
          });

          return histories;
        }),
      catch: error => new DatabaseError("Failed to get point history", error),
    });
  },
);
