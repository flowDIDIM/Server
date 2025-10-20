import { Effect, Either } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { Application } from "@/db/schema/application";
import type { User } from "@/db/schema/auth";
import type { TestRuntime } from "@/lib/test-helpers";

import { NotFoundError } from "@/domain/error/not-found-error";
import { UnauthorizedError } from "@/domain/error/unauthorized-error";
import {
  appFactory,
  createTestDatabase,
  createTestRuntime,
  daysAgoString,
  expectEffectError,
  testLogFactory,
  testerFactory,
  todayString,
  usersFactory,
} from "@/lib/test-helpers";

import { getAppTestStatusUseCase } from "./get-app-test-status.use-case";

describe("getAppTestStatusUseCase", () => {
  let db: Database;
  let app: Application;
  let developer: User;
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

    developer = await userFactory.create();
    app = await appFactoryInstance.create({ developerId: developer.id });
    runtime = createTestRuntime(db);
  });

  it("테스터가 없을 때 빈 배열을 반환한다", async () => {
    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result).toMatchObject({
      status: "ONGOING",
      progress: 0,
      testers: [],
    });
  });

  it("테스터가 테스트를 시작하지 않았을 때 currentDay가 0이다", async () => {
    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result.testers).toHaveLength(1);
    expect(result.testers[0]).toMatchObject({
      email: tester.email,
      currentDay: 0,
      completed: false,
      dropped: false,
    });
  });

  it("테스터가 오늘 시작하고 오늘 완료했을 때", async () => {
    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: todayString(),
    });

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result.testers[0]).toMatchObject({
      email: tester.email,
      currentDay: 1,
      lastCompletedDay: 1,
      completed: true,
      dropped: false,
    });
  });

  it("테스터가 3일 전 시작하고 매일 완료했을 때", async () => {
    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(3),
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(2),
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(1),
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: todayString(),
    });

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result.testers[0]).toMatchObject({
      email: tester.email,
      currentDay: 4,
      lastCompletedDay: 4,
      completed: true,
      dropped: false,
    });
  });

  it("테스터가 10일 전 시작했지만 오늘 실행하지 않았을 때", async () => {
    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(10),
    });

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result.testers[0]).toMatchObject({
      email: tester.email,
      currentDay: 11,
      lastCompletedDay: 1,
      completed: false,
      dropped: true,
    });
  });

  it("테스터가 5일 전 시작하고 1~3일차만 실행했을 때 (이탈)", async () => {
    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(5),
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(4),
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(3),
    });

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result.testers[0]).toMatchObject({
      email: tester.email,
      currentDay: 6,
      lastCompletedDay: 3,
      completed: false,
      dropped: true,
    });
  });

  it("가장 늦게 시작한 사람 기준으로 진행률을 계산한다", async () => {
    const tester1 = await userFactory.create();
    const tester2 = await userFactory.create();

    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester1.id,
    });
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester2.id,
    });

    // 테스터1: 7일 전 시작
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester1.id,
      testedAt: daysAgoString(7),
    });

    // 테스터2: 3일 전 시작 (가장 늦게 시작)
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester2.id,
      testedAt: daysAgoString(3),
    });

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    // 가장 늦게 시작한 사람 기준: 4일차 / 14일 = 28.57% -> 29%
    expect(result.progress).toBe(29);
  });

  it("14일 이상 경과하면 진행률이 100%를 넘지 않는다", async () => {
    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: daysAgoString(15),
    });

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result.progress).toBe(100);
  });

  it("존재하지 않는 앱 조회시 에러를 발생시킨다", async () => {
    await expectEffectError(
      getAppTestStatusUseCase("non-exist-id", developer.id),
      runtime,
      new NotFoundError("Application not found"),
    );
  });

  it("다른 개발자의 앱 조회시 에러를 발생시킨다", async () => {
    const otherDeveloper = await userFactory.create();

    await expectEffectError(
      getAppTestStatusUseCase(app.id, otherDeveloper.id),
      runtime,
      new UnauthorizedError(),
    );
  });

  it("여러 테스터의 상태를 동시에 조회한다", async () => {
    const tester1 = await userFactory.create();
    const tester2 = await userFactory.create();
    const tester3 = await userFactory.create();

    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester1.id,
    });
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester2.id,
    });
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester3.id,
    });

    // 테스터1: 오늘 시작, 완료
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester1.id,
      testedAt: todayString(),
    });

    // 테스터2: 3일 전 시작, 1일차만 완료 (이탈)
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester2.id,
      testedAt: daysAgoString(3),
    });

    // 테스터3: 시작 안함
    // (로그 없음)

    const result = await getAppTestStatusUseCase(app.id, developer.id).pipe(
      runtime.runPromise,
    );

    expect(result.testers).toHaveLength(3);
    expect(result.testers[0]).toMatchObject({
      email: tester1.email,
      currentDay: 1,
      completed: true,
      dropped: false,
    });
    expect(result.testers[1]).toMatchObject({
      email: tester2.email,
      currentDay: 4,
      lastCompletedDay: 1,
      completed: false,
      dropped: true,
    });
    expect(result.testers[2]).toMatchObject({
      email: tester3.email,
      currentDay: 0,
      completed: false,
      dropped: false,
    });
  });
});
