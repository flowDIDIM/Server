import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { Application } from "@/db/schema/application";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { appFactory, appImageFactory, createTestDatabase } from "@/lib/test-helpers";

import { editAppUseCase } from "./edit-app.use-case";

describe("editAppUseCase", () => {
  let db: Database;
  let app: Application;
  let applicationId: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    app = await appFactory(db).create();
    await appImageFactory(db).create(3);
    applicationId = app.id;
  });

  it("앱 정보를 성공적으로 수정한다", async () => {
    const input = {
      applicationId,
      name: "Updated App",
      shortDescription: "Updated short description",
      fullDescription: "Updated full description",
    };

    const result = await Effect.runPromise(
      editAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toBeDefined();
    expect(result.name).toBe(input.name);
    expect(result.shortDescription).toBe(input.shortDescription);
    expect(result.fullDescription).toBe(input.fullDescription);

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
    });

    expect(dbApp?.name).toBe(input.name);
    expect(dbApp?.shortDescription).toBe(input.shortDescription);
    expect(dbApp?.fullDescription).toBe(input.fullDescription);
  });

  it("앱 이미지를 수정한다", async () => {
    const input = {
      applicationId,
      images: ["https://example.com/new-image1.png", "https://example.com/new-image2.png"],
    };

    const result = await Effect.runPromise(
      editAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toBeDefined();

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
      with: { images: true },
    });

    expect(dbApp?.images).toHaveLength(2);
    expect(dbApp?.images[0].url).toBe(input.images[0]);
    expect(dbApp?.images[1].url).toBe(input.images[1]);
  });

  it("앱 이미지를 빈 배열로 수정하면 모든 이미지가 삭제된다", async () => {
    const input = {
      applicationId,
      images: [],
    };

    const result = await Effect.runPromise(
      editAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toBeDefined();

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
      with: { images: true },
    });

    expect(dbApp?.images).toHaveLength(0);
  });

  it("수정할 데이터가 없으면 원본 앱을 반환한다", async () => {
    const input = {
      applicationId,
    };

    const result = await Effect.runPromise(
      editAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toBeDefined();
    expect(result.name).toBe(app.name);
  });

  it("존재하지 않는 앱 수정시 에러를 발생시킨다", async () => {
    const input = {
      applicationId: "non-existent-id",
      name: "Updated App",
    };

    await expect(
      Effect.runPromise(
        editAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
      ),
    ).rejects.toThrow();
  });
});
