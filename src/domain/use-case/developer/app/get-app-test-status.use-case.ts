import { asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { differenceInDays, format } from "date-fns";

import { DatabaseService } from "@/db";
import { testerTable, testLogTable } from "@/db/schema/test";
import { applicationTable } from "@/db/schema";
import { mapHttpError } from "@/lib/effect";
import { NotFoundError } from "@/domain/error/not-found-error";
import { UnauthorizedError } from "@/domain/error/unauthorized-error";
import { DEFAULT_TEST_DAY } from "@/domain/constants/test-config";

export const getAppTestStatusUseCase = Effect.fn("getAppTestStatusUseCase")(
  function* (applicationId: string, developerId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(() =>
      db.transaction(async tx => {
        const application = await tx.query.applicationTable.findFirst({
          where: eq(applicationTable.id, applicationId),
        });

        if (!application) {
          throw new NotFoundError("Application not found");
        }

        if (application.developerId !== developerId) {
          throw new UnauthorizedError();
        }

        const testers = await tx.query.testerTable.findMany({
          where: eq(testerTable.applicationId, applicationId),
          with: {
            logs: {
              where: eq(testLogTable.applicationId, applicationId),
              orderBy: [asc(testLogTable.testedAt)],
            },
            user: true,
          },
        });

        // 현재 날짜 (YYYY-MM-DD)
        const today = format(new Date(), "yyyy-MM-dd");

        // 각 테스터의 상태 계산
        const mappedTesters = testers.map(tester => {
          const logs = tester.logs;

          // 테스트 로그가 없으면 시작 안한 것으로 간주
          if (logs.length === 0) {
            return {
              email: tester.user.email,
              currentDay: 0,
              completed: false,
              dropped: tester.status === "DROPPED",
            };
          }

          const firstLog = logs[0]; // 가장 오래된 로그 (시작일)
          const lastLog = logs[logs.length - 1]; // 가장 최근 로그

          // 시작일로부터 현재까지 며칠 지났는지 계산 (현재 일차)
          const startDate = new Date(firstLog.testedAt);
          const currentDate = new Date(today);
          const daysSinceStart = differenceInDays(currentDate, startDate);
          const currentDay = daysSinceStart + 1; // 1일차부터 시작

          // 마지막 로그까지 며칠 차였는지
          const lastLogDate = new Date(lastLog.testedAt);
          const daysToLastLog = differenceInDays(lastLogDate, startDate);
          const lastCompletedDay = daysToLastLog + 1;

          // 마지막 로그가 오늘인지 확인
          const completedToday = lastLog.testedAt === today;

          // 시작일부터 마지막 로그까지 연속으로 실행했는지 확인
          const expectedLogCount = lastCompletedDay;
          const actualLogCount = logs.length;
          const isConsecutive = expectedLogCount === actualLogCount;

          // 완료 여부: 오늘까지 연속으로 완료한 경우
          const completed = completedToday && isConsecutive;

          // 이탈 여부: 연속으로 완료하지 못했거나 오늘 완료하지 못한 경우
          const dropped = tester.status === "DROPPED" || !completed;

          return {
            email: tester.user.email,
            currentDay,
            lastCompletedDay,
            completed,
            dropped,
          };
        });

        // 가장 늦게 시작한 사람의 시작일 찾기
        const latestStartDate = testers.reduce(
          (latest, tester) => {
            if (tester.logs.length === 0) return latest;
            const firstLog = tester.logs[0];
            return !latest || firstLog.testedAt > latest
              ? firstLog.testedAt
              : latest;
          },
          null as string | null,
        );

        // 전체 진행률 계산 (DEFAULT_TEST_DAY 기준, 가장 늦게 시작한 사람 기준)
        let progress = 0;
        if (latestStartDate) {
          const startDate = new Date(latestStartDate);
          const currentDate = new Date(today);
          const daysPassed = differenceInDays(currentDate, startDate) + 1;
          progress = Math.min(
            Math.round((daysPassed / DEFAULT_TEST_DAY) * 100),
            100,
          );
        }

        return {
          status: application.status,
          progress,
          testers: mappedTesters,
        };
      }),
    ).pipe(mapHttpError);
  },
);
