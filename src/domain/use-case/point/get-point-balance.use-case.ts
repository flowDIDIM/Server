import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/domain/error/database-error";
import { userPointTable } from "@/db/schema/point";

export const getPointBalanceUseCase = Effect.fn("getPointBalanceUseCase")(
  function* (userId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async tx => {
          const userPoint = await tx.query.userPointTable.findFirst({
            where: eq(userPointTable.userId, userId),
          });

          return userPoint?.balance ?? 0;
        }),
      catch: error => new DatabaseError("Failed to get point balance", error),
    });
  },
);
