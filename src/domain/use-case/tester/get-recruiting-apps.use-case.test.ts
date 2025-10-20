import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { User } from "@/db/schema/auth";
import type { TestRuntime } from "@/lib/test-helpers";

import {
  appFactory,
  createTestDatabase,
  createTestRuntime,
  testerFactory,
  usersFactory,
} from "@/lib/test-helpers";

import { getRecruitingAppsUseCase } from "./get-recruiting-apps.use-case";

describe("getRecruitingAppsUseCase", () => {
  let db: Database;
  let developer: User;
  let runtime: TestRuntime;
  let userFactory: ReturnType<typeof usersFactory>;
  let appFactoryInstance: ReturnType<typeof appFactory>;
  let testerFactoryInstance: ReturnType<typeof testerFactory>;

  beforeEach(async () => {
    db = await createTestDatabase();
    userFactory = usersFactory(db);
    appFactoryInstance = appFactory(db);
    testerFactoryInstance = testerFactory(db);

    developer = await userFactory.create();
    runtime = createTestRuntime(db);
  });

  it("모집 중인 앱 목록을 페이지네이션으로 조회한다", async () => {
    // 3개의 모집 중인 앱 생성
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const result = await getRecruitingAppsUseCase(1, 10).pipe(
      runtime.runPromise,
    );

    expect(result.apps).toHaveLength(3);
    expect(result.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 3,
      totalPages: 1,
    });
  });

  it("결제가 완료되지 않은 앱은 제외한다", async () => {
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "PENDING",
    });

    const result = await getRecruitingAppsUseCase(1, 10).pipe(
      runtime.runPromise,
    );

    expect(result.apps).toHaveLength(1);
  });

  it("테스트가 완료된 앱은 제외한다", async () => {
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "ONGOING",
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "COMPLETED",
    });

    const result = await getRecruitingAppsUseCase(1, 10).pipe(
      runtime.runPromise,
    );

    expect(result.apps).toHaveLength(1);
  });

  it("정원이 찬 앱은 제외한다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    // app1에 20명의 테스터 추가 (정원)
    for (let i = 0; i < 20; i++) {
      const tester = await userFactory.create();
      await testerFactoryInstance.create({
        applicationId: app1.id,
        testerId: tester.id,
      });
    }

    const result = await getRecruitingAppsUseCase(1, 10).pipe(
      runtime.runPromise,
    );

    // app2만 반환되어야 함
    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].id).toBe(app2.id);
  });

  it("페이지네이션이 올바르게 작동한다", async () => {
    // 5개의 앱 생성
    for (let i = 0; i < 5; i++) {
      await appFactoryInstance.create({
        developerId: developer.id,
        paymentStatus: "COMPLETED",
      });
    }

    const page1 = await getRecruitingAppsUseCase(1, 2).pipe(
      runtime.runPromise,
    );
    const page2 = await getRecruitingAppsUseCase(2, 2).pipe(
      runtime.runPromise,
    );

    expect(page1.apps).toHaveLength(2);
    expect(page2.apps).toHaveLength(2);
    expect(page1.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 5,
      totalPages: 3,
    });
    expect(page2.pagination).toMatchObject({
      page: 2,
      pageSize: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it("앱 정보에 테스터 수와 정원을 포함한다", async () => {
    const app = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    // 5명의 테스터 추가
    for (let i = 0; i < 5; i++) {
      const tester = await userFactory.create();
      await testerFactoryInstance.create({
        applicationId: app.id,
        testerId: tester.id,
      });
    }

    const result = await getRecruitingAppsUseCase(1, 10).pipe(
      runtime.runPromise,
    );

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0]).toMatchObject({
      testerCount: 5,
      testerCapacity: 20,
    });
  });

  it("최신 순으로 정렬된다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const result = await getRecruitingAppsUseCase(1, 10).pipe(
      runtime.runPromise,
    );

    expect(result.apps).toHaveLength(2);
    expect(result.apps[0].id).toBe(app2.id); // 더 최근에 생성된 앱
    expect(result.apps[1].id).toBe(app1.id);
  });
});
