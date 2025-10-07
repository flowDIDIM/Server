import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { pointHistoryTable, userPointTable } from "@/db/schema/point";

interface SpendPointInput {
  userId: string;
  amount: number;
  reason: string;
}

export const spendPointUseCase = Effect.fn("spendPointUseCase")(function* (
  input: SpendPointInput,
) {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise({
    try: () =>
      db.transaction(async tx => {
        const userPoint = await tx.query.userPointTable.findFirst({
          where: eq(userPointTable.userId, input.userId),
        });

        if (!userPoint) {
          throw new Error("User point not found");
        }

        if (userPoint.balance < input.amount) {
          throw new Error("Insufficient point balance");
        }

        const newBalance = userPoint.balance - input.amount;

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
            type: "spend",
            reason: input.reason,
            balance: newBalance,
          })
          .returning();

        return {
          userPoint: updatedUserPoint,
          pointHistory,
        };
      }),
    catch: error => new DatabaseError("Failed to spend point", error),
  });
});
