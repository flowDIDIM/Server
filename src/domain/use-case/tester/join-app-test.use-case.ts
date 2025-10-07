import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { appTesterTable } from "@/db/schema/test";

interface JoinAppTestInput {
  applicationId: string;
  testerId: string;
}

export const joinAppTestUseCase = Effect.fn("joinAppTestUseCase")(function* (
  input: JoinAppTestInput,
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

        if (existingTester) {
          if (existingTester.status === "dropped") {
            const [updatedTester] = await tx
              .update(appTesterTable)
              .set({ status: "active" })
              .where(eq(appTesterTable.id, existingTester.id))
              .returning();
            return updatedTester;
          }
          return existingTester;
        }

        const [appTester] = await tx
          .insert(appTesterTable)
          .values({
            applicationId: input.applicationId,
            testerId: input.testerId,
            status: "active",
          })
          .returning();

        return appTester;
      }),
    catch: error => new DatabaseError("Failed to join app test", error),
  });
});
