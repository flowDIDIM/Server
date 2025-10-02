import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { Application } from "@/db/schema/application";
import type { TestRuntime } from "@/lib/test-helpers";

import { applicationTable } from "@/db/schema/application";
import { NotFoundError } from "@/domain/error/not-found-error";
import { appFactory, appImageFactory, createTestDatabase, createTestRuntime } from "@/lib/test-helpers";

import { patchAppUseCase } from "./patch-app.use-case";

describe("editAppUseCase", () => {
  let db: Database;
  let app: Application;
  let applicationId: string;
  let runtime: TestRuntime;

  beforeEach(async () => {
    db = await createTestDatabase();
    app = await appFactory(db).create();
    await appImageFactory(db).create(3);
    applicationId = app.id;
    runtime = createTestRuntime(db);
  });

  it("앱 정보를 성공적으로 수정한다", async () => {
    const input = {
      name: "Updated App",
      shortDescription: "Updated short description",
      fullDescription: "Updated full description",
    };

    const result = await patchAppUseCase(applicationId, input).pipe(runtime.runPromise);

    expect(result).toMatchObject({
      name: input.name,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
    });

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
    });

    expect(dbApp).toMatchObject({
      name: input.name,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
    });
  });

  it("앱 이미지를 수정한다", async () => {
    const input = {
      images: ["https://example.com/new-image1.png", "https://example.com/new-image2.png"],
    };

    const result = await patchAppUseCase(applicationId, input).pipe(runtime.runPromise);

    expect(result).toBeDefined();

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
      with: { images: true },
    });

    expect(dbApp?.images).toMatchObject([
      { url: input.images[0] },
      { url: input.images[1] },
    ]);
  });

  it("앱 이미지를 빈 배열로 수정하면 모든 이미지가 삭제된다", async () => {
    const input = {
      images: [],
    };

    const result = await patchAppUseCase(applicationId, input).pipe(runtime.runPromise);

    expect(result).toBeDefined();

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
      with: { images: true },
    });

    expect(dbApp?.images).toHaveLength(0);
  });

  it("수정할 데이터가 없으면 원본 앱을 반환한다", async () => {
    const result = await patchAppUseCase(applicationId, {}).pipe(runtime.runPromise);

    expect(result).toBeDefined();
    expect(result.name).toBe(app.name);
  });

  it("존재하지 않는 앱 수정시 에러를 발생시킨다", async () => {
    const input = {
      name: "Updated App",
    };

    await expect(
      patchAppUseCase("non-exist-id", input).pipe(Effect.either, runtime.runPromise),
    ).resolves.toEqual(Either.left(new NotFoundError("Application not found")));
  });
});
