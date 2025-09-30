import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { appTestConfigTable } from "@/db/schema/test";

interface CreateTestConfigInput {
  applicationId: string;
  requiredDays?: number;
  requiredTesters?: number;
}

export const createTestConfigUseCase = Effect.fn("createTestConfigUseCase")(
  function* (input: CreateTestConfigInput) {
    const db = yield* DatabaseService;

    const existingConfig = yield* Effect.tryPromise(() =>
      db.query.appTestConfigTable.findFirst({
        where: eq(appTestConfigTable.applicationId, input.applicationId),
      }),
    );

    if (existingConfig) {
      return yield* Effect.fail(new Error("Test config already exists for this app"));
    }

    const [testConfig] = yield* Effect.tryPromise(() =>
      db
        .insert(appTestConfigTable)
        .values({
          applicationId: input.applicationId,
          status: "in_progress",
          requiredDays: input.requiredDays || 14,
          requiredTesters: input.requiredTesters || 20,
          startedAt: new Date(),
        })
        .returning(),
    );

    return testConfig;
  },
);
