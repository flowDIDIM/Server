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

import { getAlmostFullAppsUseCase } from "./get-almost-full-apps.use-case";

describe("getAlmostFullAppsUseCase", () => {
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

  it("정원에 가까운 3개의 앱을 조회한다", async () => {
    // 5개의 앱 생성
    for (let i = 0; i < 5; i++) {
      await appFactoryInstance.create({
        developerId: developer.id,
        paymentStatus: "COMPLETED",
      });
    }

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(3);
  });

  it("테스터 수가 많은 순서로 정렬된다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    const app3 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    // app1에 5명 추가
    await createBulkTesters(db, app1.id, 5);

    // app2에 10명 추가
    await createBulkTesters(db, app2.id, 10);

    // app3에 15명 추가
    await createBulkTesters(db, app3.id, 15);

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(app3.id); // 15명
    expect(result[0].testerCount).toBe(15);
    expect(result[1].id).toBe(app2.id); // 10명
    expect(result[1].testerCount).toBe(10);
    expect(result[2].id).toBe(app1.id); // 5명
    expect(result[2].testerCount).toBe(5);
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
    await createBulkTesters(db, app1.id, 20);

    // app2에 15명의 테스터 추가
    await createBulkTesters(db, app2.id, 15);

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

    // app2만 반환되어야 함
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(app2.id);
  });

  it("모집 중인 앱만 조회한다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "ONGOING",
    });
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
      status: "COMPLETED",
    });

    // 각각 테스터 추가
    const tester1 = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app1.id,
      testerId: tester1.id,
    });

    const tester2 = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app2.id,
      testerId: tester2.id,
    });

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

    // ONGOING인 app1만 반환되어야 함
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(app1.id);
  });

  it("결제가 완료된 앱만 조회한다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "PENDING",
    });

    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app1.id,
      testerId: tester.id,
    });

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(app1.id);
  });

  it("앱 정보에 필수 필드가 포함된다", async () => {
    const app = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const tester = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

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

  it("모집 중인 앱이 3개 미만이면 있는 만큼만 반환한다", async () => {
    const app1 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });
    const app2 = await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const tester1 = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app1.id,
      testerId: tester1.id,
    });

    const tester2 = await userFactory.create();
    await testerFactoryInstance.create({
      applicationId: app2.id,
      testerId: tester2.id,
    });

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(2);
  });

  it("테스터가 없는 앱도 포함된다", async () => {
    await appFactoryInstance.create({
      developerId: developer.id,
      paymentStatus: "COMPLETED",
    });

    const result = await getAlmostFullAppsUseCase().pipe(runtime.runPromise);

    expect(result).toHaveLength(1);
    expect(result[0].testerCount).toBe(0);
  });
});
