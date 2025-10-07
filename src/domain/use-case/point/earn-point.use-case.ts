import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { pointHistoryTable, userPointTable } from "@/db/schema/point";

interface EarnPointInput {
  userId: string;
  amount: number;
  reason: string;
}

export const earnPointUseCase = Effect.fn("earnPointUseCase")(function* (
  input: EarnPointInput,
) {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise({
    try: () =>
      db.transaction(async tx => {
        const existingUserPoint = await tx.query.userPointTable.findFirst({
          where: eq(userPointTable.userId, input.userId),
        });

        const userPoint =
          existingUserPoint ||
          (
            await tx
              .insert(userPointTable)
              .values({
                userId: input.userId,
                balance: 0,
              })
              .returning()
          )[0];

        const newBalance = userPoint.balance + input.amount;

        const [updatedUserPoint] = await tx
          .update(userPointTable)
          .set({ balance: newBalance })
          .where(eq(userPointTable.userId, input.userId))
          .returning();

        const [pointHistory] = await tx
          .insert(pointHistoryTable)
          .values({
            userId: input.userId,
            amount: input.amount,
            type: "earn",
            reason: input.reason,
            balance: newBalance,
          })
          .returning();

        return {
          userPoint: updatedUserPoint,
          pointHistory,
        };
      }),
    catch: error => new DatabaseError("Failed to earn point", error),
  });
});
