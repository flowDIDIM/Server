import { format, subDays } from "date-fns";
import { Effect, Either } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { Application } from "@/db/schema/application";
import type { User } from "@/db/schema/auth";
import type { TestRuntime } from "@/lib/test-helpers";

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
    app = await appFactoryInstance.create({ developerId: developer.id });
    tester = await userFactory.create();

    // 테스터를 앱 테스트에 가입시킴
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    runtime = createTestRuntime(db);
  });

  it("테스트 로그를 성공적으로 기록한다", async () => {
    const result = await recordTestLogUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );

    const today = format(new Date(), "yyyy-MM-dd");

    expect(result).toMatchObject({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: today,
      earnedPoints: 0,
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

  it("연속된 날짜에 기록할 수 있다", async () => {
    const threeDaysAgo = format(subDays(new Date(), 3), "yyyy-MM-dd");
    const twoDaysAgo = format(subDays(new Date(), 2), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");

    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: threeDaysAgo,
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: twoDaysAgo,
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: yesterday,
    });

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

    expect(allLogs).toHaveLength(4);
  });
});
