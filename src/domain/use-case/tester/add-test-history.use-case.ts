import { and, eq, gte, lt } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { appTestConfigTable, testHistoryTable } from "@/db/schema/test";
import { earnPointUseCase } from "@/domain/use-case/point/earn-point.use-case";

interface AddTestHistoryInput {
  applicationId: string;
  testerId: string;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calculatePointsForDay(day: number): number {
  return 10 + (day - 1) * 5;
}

export const addTestHistoryUseCase = Effect.fn("addTestHistoryUseCase")(
  function* (input: AddTestHistoryInput) {
    const db = yield* DatabaseService;

    const result = yield* Effect.tryPromise({
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
            return { testHistory: existingHistory[0], isNewDay: false };
          }

          const [testHistory] = await tx
            .insert(testHistoryTable)
            .values({
              applicationId: input.applicationId,
              testerId: input.testerId,
              testedAt: new Date(),
            })
            .returning();

          return { testHistory, isNewDay: true };
        }),
      catch: error => new DatabaseError("Failed to add test history", error),
    });

    if (result.isNewDay) {
      const completedDay = yield* Effect.tryPromise({
        try: async () => {
          const testConfig = await db.query.appTestConfigTable.findFirst({
            where: eq(appTestConfigTable.applicationId, input.applicationId),
          });

          const startDate = testConfig?.startedAt ?? new Date();

          const allHistories = await db.query.testHistoryTable.findMany({
            where: and(
              eq(testHistoryTable.applicationId, input.applicationId),
              eq(testHistoryTable.testerId, input.testerId),
              gte(testHistoryTable.testedAt, startDate),
            ),
            columns: {
              testedAt: true,
            },
          });

          const uniqueDates = new Set(
            allHistories.map(h => toDateString(h.testedAt)),
          );

          return uniqueDates.size;
        },
        catch: error => new DatabaseError("Failed to calculate completed days", error),
      });

      const points = calculatePointsForDay(completedDay);

      yield* earnPointUseCase({
        userId: input.testerId,
        amount: points,
        reason: `테스트 ${completedDay}일차 완료`,
      });
    }

    return result.testHistory;
  },
);
