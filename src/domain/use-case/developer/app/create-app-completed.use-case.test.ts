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

import { createAppCompletedUseCase } from "./create-app-completed.use-case";

describe("createAppCompletedUseCase", () => {
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

  it("결제 완료 상태로 앱을 성공적으로 생성한다", async () => {
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

    const result = await createAppCompletedUseCase(input).pipe(
      runtime.runPromise,
    );

    expect(result).toMatchObject({
      packageName: input.packageName,
      name: input.name,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      icon: input.icon,
      trackName: input.trackName,
      paymentStatus: "COMPLETED",
    });

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.packageName, input.packageName),
      with: { images: true },
    });

    expect(dbApp).toBeDefined();
    expect(dbApp?.paymentStatus).toBe("COMPLETED");
    expect(dbApp?.images).toMatchObject([
      { url: input.images[0] },
      { url: input.images[1] },
    ]);
  });

  it("이미지 없이 결제 완료 상태로 앱을 생성한다", async () => {
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

    const result = await createAppCompletedUseCase(input).pipe(
      runtime.runPromise,
    );

    expect(result).toBeDefined();
    expect(result.paymentStatus).toBe("COMPLETED");

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.packageName, input.packageName),
      with: { images: true },
    });

    expect(dbApp).toBeDefined();
    expect(dbApp?.paymentStatus).toBe("COMPLETED");
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

    await createAppCompletedUseCase(input).pipe(runtime.runPromise);

    const duplicateInput = {
      ...input,
      name: "Second App",
    };

    await expect(
      createAppCompletedUseCase(duplicateInput).pipe(
        Effect.either,
        runtime.runPromise,
      ),
    ).resolves.toEqual(
      Either.left(
        new ConflictError("Application with this package name already exists"),
      ),
    );
  });

  it("여러 이미지와 함께 앱을 생성한다", async () => {
    const input = {
      developerId,
      packageName: "com.example.multiimage",
      trackName: "internal",
      name: "Multi Image App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [
        "https://example.com/image1.png",
        "https://example.com/image2.png",
        "https://example.com/image3.png",
        "https://example.com/image4.png",
      ],
    };

    const result = await createAppCompletedUseCase(input).pipe(
      runtime.runPromise,
    );

    expect(result.paymentStatus).toBe("COMPLETED");

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.packageName, input.packageName),
      with: { images: true },
    });

    expect(dbApp?.images).toHaveLength(4);
    expect(dbApp?.images.map(img => img.url)).toEqual(input.images);
  });
});
