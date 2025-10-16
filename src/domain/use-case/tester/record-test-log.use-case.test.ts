import { format, subDays } from "date-fns";
import { Effect, Either } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { Application } from "@/db/schema/application";
import type { User } from "@/db/schema/auth";
import type { TestRuntime } from "@/lib/test-helpers";

import { testerTable } from "@/db/schema/test";
import { ConflictError } from "@/domain/error/conflict-error";
import { NotFoundError } from "@/domain/error/not-found-error";
import {
  appFactory,
  createTestDatabase,
  createTestRuntime,
  testerFactory,
  testLogFactory,
  usersFactory,
} from "@/lib/test-helpers";

import { recordTestLogUseCase } from "./record-test-log.use-case";
import { and, eq } from "drizzle-orm";

describe("recordTestLogUseCase", () => {
  let db: Database;
  let app: Application;
  let tester: User;
  let runtime: TestRuntime;
  let userFactory: ReturnType<typeof usersFactory>;
  let appFactoryInstance: ReturnType<typeof appFactory>;
  let testerFactoryInstance: ReturnType<typeof testerFactory>;
  let testLogFactoryInstance: ReturnType<typeof testLogFactory>;

  beforeEach(async () => {
    db = await createTestDatabase();
    userFactory = usersFactory(db);
    appFactoryInstance = appFactory(db);
    testerFactoryInstance = testerFactory(db);
    testLogFactoryInstance = testLogFactory(db);

    const developer = await userFactory.create();
    app = await appFactoryInstance.create({
      developerId: developer.id,
      price: 10000, // 10,000원 결제
    });
    tester = await userFactory.create();

    // 테스터를 앱 테스트에 가입시킴
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      earnedPoints: 0,
    });

    runtime = createTestRuntime(db);
  });

  it("테스트 로그를 성공적으로 기록하고 포인트를 지급한다", async () => {
    const result = await recordTestLogUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );

    const today = format(new Date(), "yyyy-MM-dd");
    // 10,000원 * 0.8 (수수료 20% 제외) / 20명 = 400원/인, 1일차 = 400 * 0.05 = 20원
    const expectedPoints = Math.floor((10000 * 0.8 / 20) * 0.05);

    expect(result).toMatchObject({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: today,
      earnedPoints: expectedPoints,
    });

    const dbLog = await db.query.testLogTable.findFirst({
      where: (testLogTable, { and, eq }) =>
        and(
          eq(testLogTable.applicationId, app.id),
          eq(testLogTable.testerId, tester.id),
          eq(testLogTable.testedAt, today),
        ),
    });

    expect(dbLog).toBeDefined();
    expect(dbLog?.earnedPoints).toBe(expectedPoints);

    // 테스터 테이블의 earnedPoints 확인
    const dbTester = await db.query.testerTable.findFirst({
      where: (testerTable, { and, eq }) =>
        and(
          eq(testerTable.applicationId, app.id),
          eq(testerTable.testerId, tester.id),
        ),
    });
    expect(dbTester?.earnedPoints).toBe(expectedPoints);

    // 포인트 테이블 확인
    const userPoint = await db.query.userPointTable.findFirst({
      where: (userPointTable, { eq }) => eq(userPointTable.userId, tester.id),
    });
    expect(userPoint?.balance).toBe(expectedPoints);

    // 포인트 히스토리 확인
    const pointHistory = await db.query.pointHistoryTable.findFirst({
      where: (pointHistoryTable, { eq }) =>
        eq(pointHistoryTable.userId, tester.id),
    });
    expect(pointHistory).toMatchObject({
      amount: expectedPoints,
      reason: "테스트 참여 1일차",
      balance: expectedPoints,
      relatedApplicationId: app.id,
    });
  });

  it("가입하지 않은 테스터가 로그 기록시 에러를 발생시킨다", async () => {
    const otherTester = await userFactory.create();

    await expect(
      recordTestLogUseCase(app.id, otherTester.id).pipe(
        Effect.either,
        runtime.runPromise,
      ),
    ).resolves.toEqual(
      Either.left(new NotFoundError("Not registered for this app test")),
    );
  });

  it("같은 날 두 번 기록시 에러를 발생시킨다", async () => {
    await recordTestLogUseCase(app.id, tester.id).pipe(runtime.runPromise);

    await expect(
      recordTestLogUseCase(app.id, tester.id).pipe(
        Effect.either,
        runtime.runPromise,
      ),
    ).resolves.toEqual(
      Either.left(new ConflictError("Test log already recorded for today")),
    );
  });

  it("다른 날짜에는 기록할 수 있다", async () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    // 어제 기록
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: yesterday,
    });

    // 오늘 기록
    const result = await recordTestLogUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );

    expect(result.testedAt).toBe(today);

    const allLogs = await db.query.testLogTable.findMany({
      where: (testLogTable, { and, eq }) =>
        and(
          eq(testLogTable.applicationId, app.id),
          eq(testLogTable.testerId, tester.id),
        ),
    });

    expect(allLogs).toHaveLength(2);
  });

  it("여러 테스터가 같은 날 기록할 수 있다", async () => {
    const tester2 = await userFactory.create();
    const tester3 = await userFactory.create();

    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester2.id,
    });
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester3.id,
    });

    const today = format(new Date(), "yyyy-MM-dd");

    const result1 = await recordTestLogUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );
    const result2 = await recordTestLogUseCase(app.id, tester2.id).pipe(
      runtime.runPromise,
    );
    const result3 = await recordTestLogUseCase(app.id, tester3.id).pipe(
      runtime.runPromise,
    );

    expect(result1.testerId).toBe(tester.id);
    expect(result2.testerId).toBe(tester2.id);
    expect(result3.testerId).toBe(tester3.id);

    const allLogs = await db.query.testLogTable.findMany({
      where: (testLogTable, { and, eq }) =>
        and(
          eq(testLogTable.applicationId, app.id),
          eq(testLogTable.testedAt, today),
        ),
    });

    expect(allLogs).toHaveLength(3);
  });

  it("한 테스터가 여러 앱의 로그를 기록할 수 있다", async () => {
    const developer = await userFactory.create();
    const app2 = await appFactoryInstance.create({ developerId: developer.id });

    await testerFactoryInstance.create({
      applicationId: app2.id,
      testerId: tester.id,
    });

    const result1 = await recordTestLogUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );
    const result2 = await recordTestLogUseCase(app2.id, tester.id).pipe(
      runtime.runPromise,
    );

    expect(result1.applicationId).toBe(app.id);
    expect(result2.applicationId).toBe(app2.id);

    const allLogs = await db.query.testLogTable.findMany({
      where: (testLogTable, { eq }) => eq(testLogTable.testerId, tester.id),
    });

    expect(allLogs).toHaveLength(2);
  });

  it("연속된 날짜에 기록하면 포인트가 누적된다", async () => {
    const threeDaysAgo = format(subDays(new Date(), 3), "yyyy-MM-dd");
    const twoDaysAgo = format(subDays(new Date(), 2), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    const pricePerPerson = (10000 * 0.8) / 20; // 400원 (수수료 20% 제외)

    // 1일차: 400 * 0.05 = 20원
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: threeDaysAgo,
      earnedPoints: Math.floor(pricePerPerson * 0.05),
    });
    // 2일차: 400 * 0.05 = 20원
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: twoDaysAgo,
      earnedPoints: Math.floor(pricePerPerson * 0.05),
    });
    // 3일차: 400 * 0.06 = 24원
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: yesterday,
      earnedPoints: Math.floor(pricePerPerson * 0.06),
    });

    // tester의 earnedPoints 업데이트
    const previousTotal = Math.floor(pricePerPerson * (0.05 + 0.05 + 0.06));
    await db
      .update(testerTable)
      .set({ earnedPoints: previousTotal })
      .where(
        and(
          eq(testerTable.applicationId, app.id),
          eq(testerTable.testerId, tester.id),
        ),
      );

    // 4일차 기록
    const result = await recordTestLogUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );

    expect(result.testedAt).toBe(today);
    // 4일차: 400 * 0.06 = 24원
    const fourthDayPoints = Math.floor(pricePerPerson * 0.06);
    expect(result.earnedPoints).toBe(fourthDayPoints);

    const allLogs = await db.query.testLogTable.findMany({
      where: (testLogTable, { and, eq }) =>
        and(
          eq(testLogTable.applicationId, app.id),
          eq(testLogTable.testerId, tester.id),
        ),
    });

    expect(allLogs).toHaveLength(4);

    // 테스터 테이블의 누적 포인트 확인
    const dbTester = await db.query.testerTable.findFirst({
      where: (testerTable, { and, eq }) =>
        and(
          eq(testerTable.applicationId, app.id),
          eq(testerTable.testerId, tester.id),
        ),
    });
    expect(dbTester?.earnedPoints).toBe(previousTotal + fourthDayPoints);
  });
});
