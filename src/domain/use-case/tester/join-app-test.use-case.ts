import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { appTesterTable } from "@/db/schema/test";

interface JoinAppTestInput {
  applicationId: string;
  testerId: string;
}

export const joinAppTestUseCase = Effect.fn("joinAppTestUseCase")(
  function* (input: JoinAppTestInput) {
    const db = yield* DatabaseService;

    const existingTester = yield* Effect.tryPromise(() =>
      db.query.appTesterTable.findFirst({
        where: and(
          eq(appTesterTable.applicationId, input.applicationId),
          eq(appTesterTable.testerId, input.testerId),
        ),
      }),
    );

    if (existingTester) {
      if (existingTester.status === "dropped") {
        const [updatedTester] = yield* Effect.tryPromise(() =>
          db
            .update(appTesterTable)
            .set({ status: "active" })
            .where(eq(appTesterTable.id, existingTester.id))
            .returning(),
        );
        return updatedTester;
      }
      return existingTester;
    }

    const [appTester] = yield* Effect.tryPromise(() =>
      db
        .insert(appTesterTable)
        .values({
          applicationId: input.applicationId,
          testerId: input.testerId,
          status: "active",
        })
        .returning(),
    );

    return appTester;
  },
);
