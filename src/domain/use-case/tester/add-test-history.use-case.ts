import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { testHistoryTable } from "@/db/schema/test";

interface AddTestHistoryInput {
  applicationId: string;
  testerId: string;
}

export const addTestHistoryUseCase = Effect.fn("addTestHistoryUseCase")(
  function* (input: AddTestHistoryInput) {
    const db = yield* DatabaseService;

    const [testHistory] = yield* Effect.tryPromise(() =>
      db
        .insert(testHistoryTable)
        .values({
          applicationId: input.applicationId,
          testerId: input.testerId,
          testedAt: new Date(),
        })
        .returning(),
    );

    return testHistory;
  },
);
