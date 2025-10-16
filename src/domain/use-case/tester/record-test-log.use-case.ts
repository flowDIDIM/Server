import { and, eq } from "drizzle-orm";
import { format } from "date-fns";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { testerTable, testLogTable } from "@/db/schema/test";
import { ConflictError } from "@/domain/error/conflict-error";
import { NotFoundError } from "@/domain/error/not-found-error";
import { mapHttpError } from "@/lib/effect";

export const recordTestLogUseCase = Effect.fn("recordTestLogUseCase")(
  function* (applicationId: string, testerId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(async () => {
      // 오늘 날짜 (YYYY-MM-DD 형식)
      const today = format(new Date(), "yyyy-MM-dd");

      // 테스터와 오늘의 로그를 한 번에 조회
      const tester = await db.query.testerTable.findFirst({
        where: and(
          eq(testerTable.applicationId, applicationId),
          eq(testerTable.testerId, testerId),
        ),
        with: {
          logs: {
            where: eq(testLogTable.testedAt, today),
          },
        },
      });

      if (!tester) {
        throw new NotFoundError("Not registered for this app test");
      }

      // 오늘 이미 기록이 있는지 확인
      if (tester.logs.length > 0) {
        throw new ConflictError("Test log already recorded for today");
      }

      // 테스트 로그 기록
      const [testLog] = await db
        .insert(testLogTable)
        .values({
          applicationId,
          testerId,
          testedAt: today,
        })
        .returning();

      return testLog;
    }).pipe(mapHttpError);
  },
);
