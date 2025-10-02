import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { NotFoundError } from "@/domain/error/not-found-error";
import { mapHttpError } from "@/lib/effect";

export const deleteAppUseCase = Effect.fn("deleteAppUseCase")(
  function* (applicationId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(
      () => db.transaction(async (tx) => {
        const existingApp = await tx.query.applicationTable.findFirst({
          where: eq(applicationTable.id, applicationId),
        });

        if (!existingApp) {
          throw new NotFoundError("Application not found");
        }

        await tx
          .delete(applicationTable)
          .where(eq(applicationTable.id, applicationId));

        return { success: true };
      }),
    ).pipe(mapHttpError);
  },
);
