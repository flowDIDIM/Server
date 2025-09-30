import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { appTestConfigTable } from "@/db/schema/test";

interface CreateTestConfigInput {
  applicationId: string;
  requiredDays?: number;
  requiredTesters?: number;
}

export const createTestConfigUseCase = Effect.fn("createTestConfigUseCase")(
  function* (input: CreateTestConfigInput) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const existingConfig = await tx.query.appTestConfigTable.findFirst({
            where: eq(appTestConfigTable.applicationId, input.applicationId),
          });

          if (existingConfig) {
            throw new Error("Test config already exists for this app");
          }

          const [testConfig] = await tx
            .insert(appTestConfigTable)
            .values({
              applicationId: input.applicationId,
              status: "in_progress",
              requiredDays: input.requiredDays || 14,
              requiredTesters: input.requiredTesters || 20,
              startedAt: new Date(),
            })
            .returning();

          return testConfig;
        }),
      catch: error => new DatabaseError("Failed to create test config", error),
    });
  },
);
