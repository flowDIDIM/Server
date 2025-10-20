import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { User } from "@/db/schema/auth";
import type { TestRuntime } from "@/lib/test-helpers";

import {
  appFactory,
  createBulkTesters,
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

  it("최신 3개의 앱을 조회한다", async () => {
    const now = Date.now();

    // 5개의 앱 생성
    for (let i = 0; i < 5; i++) {
      await appFactoryInstance.create({
        developerId: developer.id,
        paymentStatus: "COMPLETED",
        createdAt: now - (5 - i) * 1000,
      });
    }

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(3);
  });

  it("모집 중인 앱만 조회한다", async () => {
    const now = Date.now();

    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "ONGOING",
      createdAt: now - 1000,
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "COMPLETED",
      createdAt: now,
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
  });

  it("결제가 완료된 앱만 조회한다", async () => {
    const now = Date.now();

    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now - 1000,
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "PENDING",
      createdAt: now,
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
  });

  it("정원이 찬 앱은 제외한다", async () => {
    const now = Date.now();

    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now - 1000,
    });
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now,
    });

    // app2에 20명의 테스터 추가 (정원)
    await createBulkTesters(db, app2.id, 20);

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
    const now = Date.now();

    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now - 2000,
    });
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now - 1000,
    });
    const app3 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now,
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(app3.id); // 가장 최근
    expect(result[1].id).toBe(app2.id);
    expect(result[2].id).toBe(app1.id);
  });

  it("모집 중인 앱이 3개 미만이면 있는 만큼만 반환한다", async () => {
    const now = Date.now();

    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now - 1000,
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      createdAt: now,
    });

    const result = await getNewestAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(2);
  });
});
