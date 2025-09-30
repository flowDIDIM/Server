import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { createTestDatabase, deleteDatabase, usersFactory } from "@/lib/test-helpers";

import { createAppUseCase } from "./create-app.use-case";

describe("createAppUseCase", async () => {
  let db: Database;
  let developerId: string;

  beforeEach(async (ctx) => {
    db = await createTestDatabase(ctx.task.id);
    const user = await usersFactory(db).create();
    developerId = user.id;
  });

  afterEach(async (ctx) => {
    await deleteDatabase(ctx.task.id);
  });

  it("앱을 성공적으로 생성한다", async () => {
    const input = {
      developerId,
      packageName: "com.example.testapp",
      trackName: "internal",
      title: "Test App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: ["https://example.com/image1.png", "https://example.com/image2.png"],
    };

    const result = await Effect.runPromise(
      createAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toBeDefined();
    expect(result.packageName).toBe(input.packageName);
    expect(result.name).toBe(input.title);
    expect(result.shortDescription).toBe(input.shortDescription);
    expect(result.fullDescription).toBe(input.fullDescription);
    expect(result.icon).toBe(input.icon);
    expect(result.trackName).toBe(input.trackName);

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.packageName, input.packageName),
      with: { images: true },
    });

    expect(dbApp).toBeDefined();
    expect(dbApp?.images).toHaveLength(2);
    expect(dbApp?.images[0].url).toBe(input.images[0]);
    expect(dbApp?.images[1].url).toBe(input.images[1]);
  });

  it("이미지 없이 앱을 생성한다", async () => {
    const input = {
      developerId,
      packageName: "com.example.noimage",
      trackName: "production",
      title: "No Image App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    };

    const result = await Effect.runPromise(
      createAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toBeDefined();

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.packageName, input.packageName),
      with: { images: true },
    });

    expect(dbApp).toBeDefined();
    expect(dbApp?.images).toHaveLength(0);
  });

  it("중복된 패키지명으로 앱 생성시 에러를 발생시킨다", async () => {
    const input = {
      developerId,
      packageName: "com.example.duplicate",
      trackName: "internal",
      title: "First App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    };

    await Effect.runPromise(
      createAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    const duplicateInput = {
      ...input,
      title: "Second App",
    };

    await expect(
      Effect.runPromise(
        createAppUseCase(duplicateInput).pipe(Effect.provideService(DatabaseService, db)),
      ),
    ).rejects.toThrow();
  });
});
