import { beforeEach, describe, expect, it } from "vitest";

import type { Database } from "@/db";
import type { TestRuntime } from "@/lib/test-helpers";

import {
  createTestDatabase,
  createTestRuntime,
  usersFactory,
} from "@/lib/test-helpers";

import { createAppUseCase } from "./create-app.use-case";
import { getAppsUseCase } from "./get-apps.use-case";

describe("getAppsUseCase", () => {
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

  it("개발자의 모든 앱을 조회한다", async () => {
    await createAppUseCase({
      developerId,
      packageName: "com.example.app1",
      trackName: "internal",
      name: "App 1",
      shortDescription: "Short description 1",
      fullDescription: "Full description 1",
      icon: "https://example.com/icon1.png",
      images: ["https://example.com/image1.png"],
    }).pipe(runtime.runPromise);

    await createAppUseCase({
      developerId,
      packageName: "com.example.app2",
      trackName: "production",
      name: "App 2",
      shortDescription: "Short description 2",
      fullDescription: "Full description 2",
      icon: "https://example.com/icon2.png",
      images: [
        "https://example.com/image2.png",
        "https://example.com/image3.png",
      ],
    }).pipe(runtime.runPromise);

    const result = await getAppsUseCase(developerId).pipe(runtime.runPromise);

    expect(result).toMatchObject([
      {
        name: "App 1",
        images: [{ url: "https://example.com/image1.png" }],
      },
      {
        name: "App 2",
        images: [
          { url: "https://example.com/image2.png" },
          { url: "https://example.com/image3.png" },
        ],
      },
    ]);
  });

  it("앱이 없는 개발자는 빈 배열을 반환한다", async () => {
    const result = await getAppsUseCase(developerId).pipe(runtime.runPromise);

    expect(result).toHaveLength(0);
  });

  it("다른 개발자의 앱은 조회되지 않는다", async () => {
    await createAppUseCase({
      developerId,
      packageName: "com.example.myapp",
      trackName: "internal",
      name: "My App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    }).pipe(runtime.runPromise);

    const otherUser = await userFactory.create();

    await createAppUseCase({
      developerId: otherUser.id,
      packageName: "com.example.otherapp",
      trackName: "production",
      name: "Other App",
      shortDescription: "Short description",
      fullDescription: "Full description",
      icon: "https://example.com/icon.png",
      images: [],
    }).pipe(runtime.runPromise);

    const result = await getAppsUseCase(developerId).pipe(runtime.runPromise);

    expect(result).toMatchObject([{ name: "My App" }]);
  });
});
