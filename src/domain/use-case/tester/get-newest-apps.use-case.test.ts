import { beforeEach, afterEach, describe, expect, it } from "vitest";

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

import { getNewestAppsUseCase } from "./get-newest-apps.use-case";

describe("getNewestAppsUseCase", () => {
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

  afterEach(async () => {
    db.$client.close();
  });

  it("최신 3개의 앱을 조회한다", async () => {
    // 5개의 앱 생성
    for (let i = 0; i < 5; i++) {
      await appFactoryInstance.create({
        developerId: developer.id,
        paymentStatus: "COMPLETED",
      });
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(3);
  });

  it("모집 중인 앱만 조회한다", async () => {
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "ONGOING",
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "COMPLETED",
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
  });

  it("결제가 완료된 앱만 조회한다", async () => {
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "PENDING",
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
  });

  it("정원이 찬 앱은 제외한다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    // app2에 20명의 테스터 추가 (정원)
    for (let i = 0; i < 20; i++) {
      const tester = await userFactory.create();
      await testerFactoryInstance.create({
        applicationId: app2.id,
        testerId: tester.id,
      });
    }

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    // app1만 반환되어야 함 (app2는 정원이 찼으므로 제외)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(app1.id);
  });

  it("앱 정보에 필수 필드가 포함된다", async () => {
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      icon: expect.any(String),
      shortDescription: expect.any(String),
      earnedPoints: expect.any(Number),
      testerCount: expect.any(Number),
      testerCapacity: 20,
    });
  });

  it("생성 날짜가 최신인 순서로 정렬된다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    const app3 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(app3.id); // 가장 최근
    expect(result[1].id).toBe(app2.id);
    expect(result[2].id).toBe(app1.id);
  });

  it("모집 중인 앱이 3개 미만이면 있는 만큼만 반환한다", async () => {
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await new Promise(resolve => setTimeout(resolve, 10));
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    console.log(result);
    expect(result).toHaveLength(2);
  });
});
