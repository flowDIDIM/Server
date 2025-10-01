import { defineFactory } from "@praha/drizzle-factory";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import * as schema from "@/db/schema";

export async function createTestDatabase() {
  const db = drizzle("file::memory:?cache=shared", { schema, casing: "snake_case", logger: true });
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });
  return db;
}

export const tables = {
  userTable: schema.userTable,

  applicationTable: schema.applicationTable,
  applicationImageTable: schema.applicationImageTable,

  gifticonProductTable: schema.gifticonProductTable,
  gifticonPurchaseTable: schema.gifticonPurchaseTable,

  paymentTable: schema.paymentTable,

  userPointTable: schema.userPointTable,
  pointHistoryTable: schema.pointHistoryTable,

  appTesterTable: schema.appTesterTable,
  testHistoryTable: schema.testHistoryTable,
  appTestConfigTable: schema.appTestConfigTable,
};

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
    developerId: () => use(usersFactory).create().then(user => user.id),
    name: `Test App ${sequence}`,
    shortDescription: `Short description ${sequence}`,
    fullDescription: `Full description ${sequence}`,
    icon: `https://example.com/icon-${sequence}.png`,
    packageName: `com.example.testapp-${sequence}`,
    trackName: "internal",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }),
});

export const appImageFactory = defineFactory({
  schema: tables,
  table: "applicationImageTable",
  resolver: ({ sequence, use }) => ({
    id: `test-app-image-id-${sequence}`,
    applicationId: () => use(appFactory).create().then(app => app.id),
    url: `https://example.com/image-${sequence}.png`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }),
});
