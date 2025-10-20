import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { TestRuntime } from "@/lib/test-helpers";

import { applicationTable } from "@/db/schema/application";
import { ConflictError } from "@/domain/error/conflict-error";
import {
  createTestDatabase,
  createTestRuntime,
  usersFactory,
} from "@/lib/test-helpers";

import { createAppUseCase } from "./create-app.use-case";

describe("createAppUseCase", () => {
  let db: Database;
  let developerId: string;
  let runtime: TestRuntime;
  let userFactory: ReturnType<typeof usersFactory>;

  beforeEach(async () => {
    db = await createTestDatabase();
    userFactory = usersFactory(db);

    const user = await userFactory.create();
    developerId = user.id;
    runtime = createTestRuntime(db);
  });

  it("앱을 성공적으로 생성한다", async () => {
    const input = {
      developerId,
      packageName: "com.example.testapp",
      trackName: "internal",
      name: "Test App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [
        "https://example.com/image1.png",
        "https://example.com/image2.png",
      ],
    };

    const result = await createAppUseCase(input).pipe(runtime.runPromise);

    expect(result).toMatchObject({
      packageName: input.packageName,
      name: input.name,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      icon: input.icon,
      trackName: input.trackName,
    });

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.packageName, input.packageName),
      with: { images: true },
    });

    expect(dbApp).toBeDefined();
    expect(dbApp?.images).toMatchObject([
      { url: input.images[0] },
      { url: input.images[1] },
    ]);
  });

  it("이미지 없이 앱을 생성한다", async () => {
    const input = {
      developerId,
      packageName: "com.example.noimage",
      trackName: "production",
      name: "No Image App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    };

    const result = await createAppUseCase(input).pipe(runtime.runPromise);

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
      name: "First App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    };

    await createAppUseCase(input).pipe(runtime.runPromise);

    const duplicateInput = {
      ...input,
      title: "Second App",
    };

    await expect(
      createAppUseCase(duplicateInput).pipe(Effect.either, runtime.runPromise),
    ).resolves.toEqual(
      Either.left(
        new ConflictError("Application with this package name already exists"),
      ),
    );
  });
});
