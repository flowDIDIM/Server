import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { appTesterTable } from "@/db/schema/test";

interface LeaveAppTestInput {
  applicationId: string;
  testerId: string;
}

export const leaveAppTestUseCase = Effect.fn("leaveAppTestUseCase")(function* (
  input: LeaveAppTestInput,
) {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise({
    try: () =>
      db.transaction(async tx => {
        const existingTester = await tx.query.appTesterTable.findFirst({
          where: and(
            eq(appTesterTable.applicationId, input.applicationId),
            eq(appTesterTable.testerId, input.testerId),
          ),
        });

        if (!existingTester) {
          throw new Error("Tester not found in this app");
        }

        const [updatedTester] = await tx
          .update(appTesterTable)
          .set({ status: "dropped" })
          .where(eq(appTesterTable.id, existingTester.id))
          .returning();

        return updatedTester;
      }),
    catch: error => new DatabaseError("Failed to leave app test", error),
  });
});
