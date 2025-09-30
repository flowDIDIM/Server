import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";

import { DatabaseService } from "@/db";
import { createTestDatabase, usersFactory } from "@/lib/test-helpers";

import { createAppUseCase } from "./create-app.use-case";
import { getAppsUseCase } from "./get-apps.use-case";

describe("getAppsUseCase", () => {
  let db: Database;
  let developerId: string;

  beforeEach(async () => {
    db = await createTestDatabase();
    const user = await usersFactory(db).create();
    developerId = user.id;
  });

  it("개발자의 모든 앱을 조회한다", async () => {
    await Effect.runPromise(
      createAppUseCase({
        developerId,
        packageName: "com.example.app1",
        trackName: "internal",
        title: "App 1",
        shortDescription: "Short description 1",
        fullDescription: "Full description 1",
        icon: "https://example.com/icon1.png",
        images: ["https://example.com/image1.png"],
      }).pipe(Effect.provideService(DatabaseService, db)),
    );

    await Effect.runPromise(
      createAppUseCase({
        developerId,
        packageName: "com.example.app2",
        trackName: "production",
        title: "App 2",
        shortDescription: "Short description 2",
        fullDescription: "Full description 2",
        icon: "https://example.com/icon2.png",
        images: ["https://example.com/image2.png", "https://example.com/image3.png"],
      }).pipe(Effect.provideService(DatabaseService, db)),
    );

    const result = await Effect.runPromise(
      getAppsUseCase(developerId).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("App 1");
    expect(result[0].images).toHaveLength(1);
    expect(result[1].name).toBe("App 2");
    expect(result[1].images).toHaveLength(2);
  });

  it("앱이 없는 개발자는 빈 배열을 반환한다", async () => {
    const result = await Effect.runPromise(
      getAppsUseCase(developerId).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toHaveLength(0);
  });

  it("다른 개발자의 앱은 조회되지 않는다", async () => {
    await Effect.runPromise(
      createAppUseCase({
        developerId,
        packageName: "com.example.myapp",
        trackName: "internal",
        title: "My App",
        shortDescription: "Short description",
        fullDescription: "Full description",
        icon: "https://example.com/icon.png",
        images: [],
      }).pipe(Effect.provideService(DatabaseService, db)),
    );

    const otherUser = await usersFactory(db).create();

    await Effect.runPromise(
      createAppUseCase({
        developerId: otherUser.id,
        packageName: "com.example.otherapp",
        trackName: "production",
        title: "Other App",
        shortDescription: "Short description",
        fullDescription: "Full description",
        icon: "https://example.com/icon.png",
        images: [],
      }).pipe(Effect.provideService(DatabaseService, db)),
    );

    const result = await Effect.runPromise(
      getAppsUseCase(developerId).pipe(Effect.provideService(DatabaseService, db)),
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("My App");
  });
});
