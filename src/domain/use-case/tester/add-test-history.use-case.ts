import { and, eq, gte, lt } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { testHistoryTable } from "@/db/schema/test";

interface AddTestHistoryInput {
  applicationId: string;
  testerId: string;
}

export const addTestHistoryUseCase = Effect.fn("addTestHistoryUseCase")(
  function* (input: AddTestHistoryInput) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

          const existingHistory = await tx
            .select()
            .from(testHistoryTable)
            .where(
              and(
                eq(testHistoryTable.applicationId, input.applicationId),
                eq(testHistoryTable.testerId, input.testerId),
                gte(testHistoryTable.testedAt, startOfDay),
                lt(testHistoryTable.testedAt, endOfDay),
              ),
            )
            .limit(1);

          if (existingHistory.length > 0) {
            return existingHistory[0];
          }

          const [testHistory] = await tx
            .insert(testHistoryTable)
            .values({
              applicationId: input.applicationId,
              testerId: input.testerId,
              testedAt: new Date(),
            })
            .returning();

          return testHistory;
        }),
      catch: error => new DatabaseError("Failed to add test history", error),
    });
  },
);
