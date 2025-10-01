import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { applicationTable } from "@/db/schema/application";

export const deleteAppUseCase = Effect.fn("deleteAppUseCase")(
  function* (applicationId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const existingApp = await tx.query.applicationTable.findFirst({
            where: eq(applicationTable.id, applicationId),
          });

          if (!existingApp) {
            throw new Error("Application not found");
          }

          await tx
            .delete(applicationTable)
            .where(eq(applicationTable.id, applicationId));

          return { success: true };
        }),
      catch: error => new DatabaseError("Failed to delete application", error),
    });
  },
);
