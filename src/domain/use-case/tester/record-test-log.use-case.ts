import { and, eq, sql } from "drizzle-orm";
import { format } from "date-fns";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { pointHistoryTable, userPointTable } from "@/db/schema/point";
import { testerTable, testLogTable } from "@/db/schema/test";
import { ConflictError } from "@/domain/error/conflict-error";
import { NotFoundError } from "@/domain/error/not-found-error";
import { env } from "@/lib/env";
import { mapHttpError } from "@/lib/effect";
import {
  DAILY_POINT_PERCENTAGE,
  DEFAULT_TESTER_COUNT,
} from "@/domain/constants/test-config";

export const recordTestLogUseCase = Effect.fn("recordTestLogUseCase")(
  function* (applicationId: string, testerId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(async () => {
      // 오늘 날짜 (YYYY-MM-DD 형식)
      const today = format(new Date(), "yyyy-MM-dd");

      return await db.transaction(async tx => {
        // 테스터, 앱 정보, 오늘의 로그를 한 번에 조회
        const tester = await tx.query.testerTable.findFirst({
          where: and(
            eq(testerTable.applicationId, applicationId),
            eq(testerTable.testerId, testerId),
          ),
          with: {
            logs: {
              where: eq(testLogTable.testedAt, today),
            },
            application: true,
          },
        });

        if (!tester) {
          throw new NotFoundError("Not registered for this app test");
        }

        // 오늘 이미 기록이 있는지 확인
        if (tester.logs.length > 0) {
          throw new ConflictError("Test log already recorded for today");
        }

        // 전체 로그 개수 조회하여 현재 몇 일차인지 계산 (기존 로그 + 1)
        const totalLogs = await tx.query.testLogTable.findMany({
          where: and(
            eq(testLogTable.applicationId, applicationId),
            eq(testLogTable.testerId, testerId),
          ),
        });
        const currentDay = totalLogs.length + 1;

        // 포인트 계산 (수수료를 제외한 금액을 분배)
        const pricePerPerson =
          (tester.application.price * (1 - env.COMMISSION_RATE)) /
          DEFAULT_TESTER_COUNT;
        const todayPercentage = DAILY_POINT_PERCENTAGE[currentDay] || 0;
        const earnedPoints = Math.floor(pricePerPerson * todayPercentage);

        // 테스트 로그 기록
        const [testLog] = await tx
          .insert(testLogTable)
          .values({
            applicationId,
            testerId,
            testedAt: today,
            earnedPoints,
          })
          .returning();

        // 테스터 테이블의 earnedPoints 업데이트
        await tx
          .update(testerTable)
          .set({
            earnedPoints: sql`${testerTable.earnedPoints} + ${earnedPoints}`,
          })
          .where(
            and(
              eq(testerTable.applicationId, applicationId),
              eq(testerTable.testerId, testerId),
            ),
          );

        // 포인트 지급 (user_point 테이블) - upsert로 처리
        const [updatedUserPoint] = await tx
          .insert(userPointTable)
          .values({
            userId: testerId,
            balance: earnedPoints,
          })
          .onConflictDoUpdate({
            target: userPointTable.userId,
            set: {
              balance: sql`${userPointTable.balance} + ${earnedPoints}`,
            },
          })
          .returning();

        const newBalance = updatedUserPoint.balance;

        // 포인트 히스토리 기록
        await tx.insert(pointHistoryTable).values({
          userId: testerId,
          amount: earnedPoints,
          reason: `테스트 참여 ${currentDay}일차`,
          balance: newBalance,
          relatedApplicationId: applicationId,
        });

        return testLog;
      });
    }).pipe(mapHttpError);
  },
);
