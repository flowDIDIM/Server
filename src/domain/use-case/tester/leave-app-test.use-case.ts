import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { appTesterTable } from "@/db/schema/test";

interface LeaveAppTestInput {
  applicationId: string;
  testerId: string;
}

export const leaveAppTestUseCase = Effect.fn("leaveAppTestUseCase")(
  function* (input: LeaveAppTestInput) {
    const db = yield* DatabaseService;

    const existingTester = yield* Effect.tryPromise(() =>
      db.query.appTesterTable.findFirst({
        where: and(
          eq(appTesterTable.applicationId, input.applicationId),
          eq(appTesterTable.testerId, input.testerId),
        ),
      }),
    );

    if (!existingTester) {
      return yield* Effect.fail(new Error("Tester not found in this app"));
    }

    const [updatedTester] = yield* Effect.tryPromise(() =>
      db
        .update(appTesterTable)
        .set({ status: "dropped" })
        .where(eq(appTesterTable.id, existingTester.id))
        .returning(),
    );

    return updatedTester;
  },
);
