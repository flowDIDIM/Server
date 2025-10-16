import { defineFactory } from "@praha/drizzle-factory";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Layer, ManagedRuntime } from "effect";

import type { Database } from "@/db";

import { DatabaseService } from "@/db";
import * as schema from "@/db/schema";

export async function createTestDatabase() {
  const db = drizzle("file::memory:?cache=shared", {
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
