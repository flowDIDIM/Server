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
  usersFactory,
} from "@/lib/test-helpers";

import { joinAppTestUseCase } from "./join-app-test.use-case";

describe("joinAppTestUseCase", () => {
  let db: Database;
  let app: Application;
  let tester: User;
  let runtime: TestRuntime;
  let userFactory: ReturnType<typeof usersFactory>;
  let appFactoryInstance: ReturnType<typeof appFactory>;
  let testerFactoryInstance: ReturnType<typeof testerFactory>;

  beforeEach(async () => {
    db = await createTestDatabase();
    userFactory = usersFactory(db);
    appFactoryInstance = appFactory(db);
    testerFactoryInstance = testerFactory(db);

    const developer = await userFactory.create();
    app = await appFactoryInstance.create({ developerId: developer.id });
    tester = await userFactory.create();
    runtime = createTestRuntime(db);
  });

  it("테스터가 앱 테스트에 성공적으로 가입한다", async () => {
    const result = await joinAppTestUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );

    expect(result).toMatchObject({
      applicationId: app.id,
      testerId: tester.id,
      status: "ONGOING",
      earnedPoints: 0,
    });

    const dbTester = await db.query.testerTable.findFirst({
      where: (testerTable, { and, eq }) =>
        and(
          eq(testerTable.applicationId, app.id),
          eq(testerTable.testerId, tester.id),
        ),
    });

    expect(dbTester).toBeDefined();
    expect(dbTester?.status).toBe("ONGOING");
  });

  it("존재하지 않는 앱에 가입시 에러를 발생시킨다", async () => {
    await expect(
      joinAppTestUseCase("non-existent-app-id", tester.id).pipe(
        Effect.either,
        runtime.runPromise,
      ),
    ).resolves.toEqual(Either.left(new NotFoundError("Application not found")));
  });

  it("이미 가입한 테스터가 다시 가입시 에러를 발생시킨다", async () => {
    await testerFactoryInstance.create({
      applicationId: app.id,
      testerId: tester.id,
    });

    await expect(
      joinAppTestUseCase(app.id, tester.id).pipe(
        Effect.either,
        runtime.runPromise,
      ),
    ).resolves.toEqual(
      Either.left(new ConflictError("Already joined this app test")),
    );
  });

  it("여러 테스터가 같은 앱에 가입할 수 있다", async () => {
    const tester2 = await userFactory.create();
    const tester3 = await userFactory.create();

    const result1 = await joinAppTestUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );
    const result2 = await joinAppTestUseCase(app.id, tester2.id).pipe(
      runtime.runPromise,
    );
    const result3 = await joinAppTestUseCase(app.id, tester3.id).pipe(
      runtime.runPromise,
    );

    expect(result1.testerId).toBe(tester.id);
    expect(result2.testerId).toBe(tester2.id);
    expect(result3.testerId).toBe(tester3.id);

    const allTesters = await db.query.testerTable.findMany({
      where: (testerTable, { eq }) =>
        eq(testerTable.applicationId, app.id),
    });

    expect(allTesters).toHaveLength(3);
  });

  it("한 테스터가 여러 앱에 가입할 수 있다", async () => {
    const developer = await userFactory.create();
    const app2 = await appFactoryInstance.create({ developerId: developer.id });
    const app3 = await appFactoryInstance.create({ developerId: developer.id });

    const result1 = await joinAppTestUseCase(app.id, tester.id).pipe(
      runtime.runPromise,
    );
    const result2 = await joinAppTestUseCase(app2.id, tester.id).pipe(
      runtime.runPromise,
    );
    const result3 = await joinAppTestUseCase(app3.id, tester.id).pipe(
      runtime.runPromise,
    );

    expect(result1.applicationId).toBe(app.id);
    expect(result2.applicationId).toBe(app2.id);
    expect(result3.applicationId).toBe(app3.id);

    const allTesters = await db.query.testerTable.findMany({
      where: (testerTable, { eq }) => eq(testerTable.testerId, tester.id),
    });

    expect(allTesters).toHaveLength(3);
  });
});
