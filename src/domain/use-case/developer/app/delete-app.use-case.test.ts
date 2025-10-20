import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { TestRuntime } from "@/lib/test-helpers";

import { applicationTable } from "@/db/schema/application";
import { NotFoundError } from "@/domain/error/not-found-error";
import { UnauthorizedError } from "@/domain/error/unauthorized-error";
import {
  createTestDatabase,
  createTestRuntime,
  usersFactory,
} from "@/lib/test-helpers";

import { createAppUseCase } from "./create-app.use-case";
import { deleteAppUseCase } from "./delete-app.use-case";

describe("deleteAppUseCase", () => {
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

  it("앱을 성공적으로 삭제한다", async () => {
    const input = {
      developerId,
      packageName: "com.example.testapp",
      trackName: "internal",
      name: "Test App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    };

    const createdApp = await createAppUseCase(input).pipe(runtime.runPromise);

    const result = await deleteAppUseCase(createdApp.id, developerId).pipe(
      runtime.runPromise,
    );

    expect(result).toEqual({ success: true });

    const dbApp = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, createdApp.id),
    });

    expect(dbApp).toBeUndefined();
  });

  it("존재하지 않는 앱 삭제시 에러를 발생시킨다", async () => {
    const nonExistentId = "non-existent-id";

    await expect(
      deleteAppUseCase(nonExistentId, developerId).pipe(
        Effect.either,
        runtime.runPromise,
      ),
    ).resolves.toEqual(Either.left(new NotFoundError("Application not found")));
  });

  it("앱 삭제시 관련 이미지도 함께 삭제된다", async () => {
    const input = {
      developerId,
      packageName: "com.example.testimages",
      trackName: "internal",
      name: "Test App with Images",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [
        "https://example.com/image1.png",
        "https://example.com/image2.png",
      ],
    };

    const createdApp = await createAppUseCase(input).pipe(runtime.runPromise);

    const appWithImages = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, createdApp.id),
      with: { images: true },
    });

    expect(appWithImages?.images).toHaveLength(2);

    await deleteAppUseCase(createdApp.id, developerId).pipe(runtime.runPromise);

    const deletedAppWithImages = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, createdApp.id),
      with: { images: true },
    });

    expect(deletedAppWithImages).toBeUndefined();
  });

  it("다른 개발자의 앱 삭제시 에러를 발생시킨다", async () => {
    const input = {
      developerId,
      packageName: "com.example.otherapp",
      trackName: "internal",
      name: "Other App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    };

    const createdApp = await createAppUseCase(input).pipe(runtime.runPromise);

    const otherUser = await userFactory.create();

    await expect(
      deleteAppUseCase(createdApp.id, otherUser.id).pipe(
        Effect.either,
        runtime.runPromise,
      ),
    ).resolves.toEqual(Either.left(new UnauthorizedError()));
  });
});
