import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { Application } from "@/db/schema/application";
import type { User } from "@/db/schema/auth";
import type { TestRuntime } from "@/lib/test-helpers";

import {
  appFactory,
  createTestDatabase,
  createTestRuntime,
  testLogFactory,
  testerFactory,
  usersFactory,
} from "@/lib/test-helpers";

import { getMyAppsUseCase } from "./get-my-apps.use-case";
import { format, subDays } from "date-fns";

describe("getMyAppsUseCase", () => {
  let db: Database;
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

    tester = await userFactory.create();
    runtime = createTestRuntime(db);
  });

  it("테스터가 참여 중인 앱 목록을 조회한다", async () => {
    const developer = await userFactory.create();
    const app1 = await appFactoryInstance.create({ developerId: developer.id });
    const app2 = await appFactoryInstance.create({ developerId: developer.id });

    await testerFactoryInstance.create({
      applicationId: app1.id,
      testerId: tester.id,
    });
    await testerFactoryInstance.create({
      applicationId: app2.id,
      testerId: tester.id,
    });

    const result = await getMyAppsUseCase(tester.id).pipe(runtime.runPromise);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      applicationId: expect.any(String),
      name: expect.any(String),
      icon: expect.any(String),
      shortDescription: expect.any(String),
      earnedPoints: expect.any(Number),
      status: "ONGOING",
      completedDays: 0,
    });
  });

  it("완료한 날짜 수를 정확히 반환한다", async () => {
    const developer = await userFactory.create();
    const app = await appFactoryInstance.create({ developerId: developer.id });

    const testerRecord = await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    // 3일간의 테스트 로그 생성
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: format(subDays(new Date(), 2), "yyyy-MM-dd"),
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: format(subDays(new Date(), 1), "yyyy-MM-dd"),
    });
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: format(new Date(), "yyyy-MM-dd"),
    });

    const result = await getMyAppsUseCase(tester.id).pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
    expect(result[0].completedDays).toBe(3);
  });

  it("이탈한 앱의 이탈 정보를 포함한다", async () => {
    const developer = await userFactory.create();
    const app = await appFactoryInstance.create({ developerId: developer.id });

    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      status: "DROPPED",
    });

    const lastLogDate = format(subDays(new Date(), 3), "yyyy-MM-dd");
    await testLogFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
      testedAt: lastLogDate,
    });

    const result = await getMyAppsUseCase(tester.id).pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("DROPPED");
    expect(result[0].droppedInfo).toMatchObject({
      lastLogDate,
      daysSinceLastLog: 3,
    });
  });

  it("참여 중인 앱이 없으면 빈 배열을 반환한다", async () => {
    const result = await getMyAppsUseCase(tester.id).pipe(runtime.runPromise);

    expect(result).toHaveLength(0);
  });

  it("최근에 참여한 앱이 먼저 나온다", async () => {
    const developer = await userFactory.create();
    const app1 = await appFactoryInstance.create({ developerId: developer.id });
    const app2 = await appFactoryInstance.create({ developerId: developer.id });

    // app1을 먼저 생성
    await testerFactoryInstance.create({
      applicationId: app1.id,
      testerId: tester.id,
    });

    // 약간의 지연 후 app2 생성
    await new Promise(resolve => setTimeout(resolve, 10));
    await testerFactoryInstance.create({
      applicationId: app2.id,
      testerId: tester.id,
    });

    const result = await getMyAppsUseCase(tester.id).pipe(runtime.runPromise);

    expect(result).toHaveLength(2);
    expect(result[0].applicationId).toBe(app2.id); // 더 최근에 생성된 앱
    expect(result[1].applicationId).toBe(app1.id);
  });
});
