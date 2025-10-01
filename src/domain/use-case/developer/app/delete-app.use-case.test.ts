import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { createTestDatabase, usersFactory } from "@/lib/test-helpers";

import { createAppUseCase } from "./create-app.use-case";
import { deleteAppUseCase } from "./delete-app.use-case";

describe("deleteAppUseCase", async () => {
  let db: Database;
  let developerId: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    const user = await usersFactory(db).create();
    developerId = user.id;
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

    const createdApp = await Effect.runPromise(
      createAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    const result = await Effect.runPromise(
      deleteAppUseCase(createdApp.id).pipe(Effect.provideService(DatabaseService, db)),
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
      Effect.runPromise(
        deleteAppUseCase(nonExistentId).pipe(Effect.provideService(DatabaseService, db)),
      ),
    ).rejects.toThrow();
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
      images: ["https://example.com/image1.png", "https://example.com/image2.png"],
    };

    const createdApp = await Effect.runPromise(
      createAppUseCase(input).pipe(Effect.provideService(DatabaseService, db)),
    );

    const appWithImages = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, createdApp.id),
      with: { images: true },
    });

    expect(appWithImages?.images).toHaveLength(2);

    await Effect.runPromise(
      deleteAppUseCase(createdApp.id).pipe(Effect.provideService(DatabaseService, db)),
    );

    const deletedAppWithImages = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, createdApp.id),
      with: { images: true },
    });

    expect(deletedAppWithImages).toBeUndefined();
  });
});
