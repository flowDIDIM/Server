import { defineFactory } from "@praha/drizzle-factory";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Effect, Either, Layer, ManagedRuntime } from "effect";
import { format, subDays } from "date-fns";
import { expect } from "vitest";

import type { Database } from "@/db";
import { DatabaseService } from "@/db";
import * as schema from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";

export async function createTestDatabase() {
  const db = drizzle(`file:test/${createId()}.db`, {
    schema,
    casing: "snake_case",
  });

  await migrate(db, {
    migrationsFolder: "./drizzle",
  });

  return db;
}

export function createTestRuntime(db: Database) {
  const testLayer = Layer.succeed(DatabaseService, db);

  return ManagedRuntime.make(testLayer);
}

export type TestRuntime = ReturnType<typeof createTestRuntime>;

export const tables = {
  userTable: schema.userTable,

  applicationTable: schema.applicationTable,
  applicationImageTable: schema.applicationImageTable,

  gifticonProductTable: schema.gifticonProductTable,
  gifticonPurchaseTable: schema.gifticonPurchaseTable,

  userPointTable: schema.userPointTable,
  pointHistoryTable: schema.pointHistoryTable,

  testerTable: schema.testerTable,
  testLogTable: schema.testLogTable,

  webhookHistoryTable: schema.webhookHistoryTable,
} as const;

export const usersFactory = defineFactory({
  schema: tables,
  table: "userTable",
  resolver: ({ sequence }) => ({
    id: `test-user-id-${sequence}`,
    name: `Test User ${sequence}`,
    email: `user${sequence}@example.com`,
    emailVerified: true,
    image: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }),
});

export const appFactory = defineFactory({
  schema: tables,
  table: "applicationTable",
  resolver: ({ sequence, use }) => ({
    id: `test-app-id-${sequence}`,
    developerId: () =>
      use(usersFactory)
        .create()
        .then(user => user.id),
    name: `Test App ${sequence}`,
    shortDescription: `Short description ${sequence}`,
    fullDescription: `Full description ${sequence}`,
    icon: `https://example.com/icon-${sequence}.png`,
    packageName: `com.example.testapp${sequence}`,
    price: 10000,
    trackName: "internal",
    status: "ONGOING",
    paymentStatus: "COMPLETED",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }),
});

export const appImageFactory = defineFactory({
  schema: tables,
  table: "applicationImageTable",
  resolver: ({ sequence, use }) => ({
    id: `test-app-image-id-${sequence}`,
    applicationId: () =>
      use(appFactory)
        .create()
        .then(app => app.id),
    url: `https://example.com/image-${sequence}.png`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }),
});

export const testerFactory = defineFactory({
  schema: tables,
  table: "testerTable",
  resolver: ({ sequence, use }) => ({
    id: `test-tester-id-${sequence}`,
    applicationId: () =>
      use(appFactory)
        .create()
        .then(app => app.id),
    testerId: () =>
      use(usersFactory)
        .create()
        .then(user => user.id),
    status: "ONGOING",
    earnedPoints: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }),
});

export const testLogFactory = defineFactory({
  schema: tables,
  table: "testLogTable",
  resolver: ({ sequence, use }) => ({
    id: `test-log-id-${sequence}`,
    applicationId: () =>
      use(appFactory)
        .create()
        .then(app => app.id),
    testerId: () =>
      use(usersFactory)
        .create()
        .then(user => user.id),
    earnedPoints: 0,
    testedAt: "2025-01-01",
  }),
});

export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function daysAgoString(days: number): string {
  return format(subDays(new Date(), days), "yyyy-MM-dd");
}

export async function createBulkTesters(
  db: Database,
  appId: string,
  count: number,
): Promise<void> {
  const userFactoryInstance = usersFactory(db);
  const testerFactoryInstance = testerFactory(db);

  for (let i = 0; i < count; i++) {
    const tester = await userFactoryInstance.create();
    await testerFactoryInstance.create({
      applicationId: appId,
      testerId: tester.id,
    });
  }
}

export async function expectEffectError<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  runtime: ManagedRuntime.ManagedRuntime<R, never>,
  expectedError: E,
): Promise<void> {
  await expect(effect.pipe(Effect.either, runtime.runPromise)).resolves.toEqual(
    Either.left(expectedError),
  );
}
