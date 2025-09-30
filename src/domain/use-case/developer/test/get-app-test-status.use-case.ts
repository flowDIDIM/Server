import { and, eq, gte } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { appTestConfigTable, appTesterTable, testHistoryTable } from "@/db/schema/test";

type TesterStatus = "completed" | "in_progress" | "not_installed" | "dropped";

interface TesterInfo {
  testerId: string;
  email: string;
  name: string;
  status: TesterStatus;
  currentDay: number;
  completedDays: number[];
  missedDays: number[];
}

interface AppTestStatus {
  testStatus: "in_progress" | "completed";
  totalTesters: number;
  progressPercentage: number;
  requiredDays: number;
  requiredTesters: number;
  testers: TesterInfo[];
}

export const getAppTestStatusUseCase = Effect.fn("getAppTestStatusUseCase")(
  function* (applicationId: string) {
    const db = yield* DatabaseService;

    const testConfig = yield* Effect.tryPromise(() =>
      db.query.appTestConfigTable.findFirst({
        where: eq(appTestConfigTable.applicationId, applicationId),
      }),
    );

    const requiredDays = testConfig?.requiredDays ?? 14;
    const requiredTesters = testConfig?.requiredTesters ?? 20;
    const testStatus = testConfig?.status ?? "in_progress";
    const startDate = testConfig?.startedAt ?? new Date();

    const appTesters = yield* Effect.tryPromise(() =>
      db.query.appTesterTable.findMany({
        where: eq(appTesterTable.applicationId, applicationId),
        with: {
          tester: {
            columns: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
    );

    const testHistories = yield* Effect.tryPromise(() =>
      db.query.testHistoryTable.findMany({
        where: and(
          eq(testHistoryTable.applicationId, applicationId),
          gte(testHistoryTable.testedAt, startDate),
        ),
        columns: {
          testerId: true,
          testedAt: true,
        },
      }),
    );

    const daysSinceStart = Math.floor(
      (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    const allRequiredDates = generateDateRange(startDate, requiredDays);
    const testerHistoryMap = groupTestHistoriesByTester(testHistories);

    const testers = appTesters.map(({ testerId, tester, status: testerStatus }) =>
      createTesterInfo(
        testerId,
        tester,
        testerStatus,
        testerHistoryMap.get(testerId) ?? new Set(),
        allRequiredDates,
        daysSinceStart,
        requiredDays,
      ),
    );

    const progressPercentage = calculateProgress(testers, requiredDays);

    return {
      testStatus,
      totalTesters: appTesters.length,
      progressPercentage,
      requiredDays,
      requiredTesters,
      testers,
    } as AppTestStatus;
  },
);

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generateDateRange(startDate: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return toDateString(date);
  });
}

function groupTestHistoriesByTester(
  histories: Array<{ testerId: string; testedAt: Date }>,
): Map<string, Set<string>> {
  return histories.reduce((acc, { testerId, testedAt }) => {
    const dateStr = toDateString(testedAt);
    const existing = acc.get(testerId) || new Set<string>();
    return acc.set(testerId, existing.add(dateStr));
  }, new Map<string, Set<string>>());
}

function calculateTesterStatus(
  testerStatus: string,
  testedDatesCount: number,
  completedDaysCount: number,
  requiredDays: number,
): TesterStatus {
  if (testerStatus === "dropped") {
    return "dropped";
  }
  if (testedDatesCount === 0) {
    return "not_installed";
  }
  if (completedDaysCount >= requiredDays) {
    return "completed";
  }
  return "in_progress";
}

function createTesterInfo(
  testerId: string,
  tester: { email: string; name: string },
  testerStatus: string,
  testedDates: Set<string>,
  allRequiredDates: string[],
  daysSinceStart: number,
  requiredDays: number,
): TesterInfo {
  const completedDays = allRequiredDates.filter(date => testedDates.has(date));
  const missedDays = allRequiredDates
    .map((date, index) => ({ date, day: index + 1 }))
    .filter(({ date, day }) => !testedDates.has(date) && day <= daysSinceStart)
    .map(({ day }) => day);

  const status = calculateTesterStatus(
    testerStatus,
    testedDates.size,
    completedDays.length,
    requiredDays,
  );

  return {
    testerId,
    email: tester.email,
    name: tester.name,
    status,
    currentDay: completedDays.length,
    completedDays: completedDays.map((_, idx) => idx + 1),
    missedDays,
  };
}

function calculateProgress(testers: TesterInfo[], requiredDays: number): number {
  const totalPossibleProgress = testers.length * requiredDays;
  if (totalPossibleProgress === 0) {
    return 0;
  }

  const actualProgress = testers.reduce((sum, tester) => sum + tester.currentDay, 0);
  return Math.round((actualProgress / totalPossibleProgress) * 100);
}
