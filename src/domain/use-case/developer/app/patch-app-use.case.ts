import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { Application } from "@/db/schema/application";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { applicationImageTable, applicationTable } from "@/db/schema/application";

export const patchAppUseCase = Effect.fn("patchAppUseCase")(
  function* (applicationId: string, input: Partial<Application & { images: string[] }>) {
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

          const filteredUpdateData = Object.fromEntries(
            Object.entries(input).filter(([key, value]) => key !== "id" && value !== undefined),
          );

          if (Object.keys(filteredUpdateData).length === 0) {
            return existingApp;
          }

          const [updatedApp] = await tx
            .update(applicationTable)
            .set(filteredUpdateData)
            .where(eq(applicationTable.id, applicationId))
            .returning();

          if (input.images !== undefined) {
            await tx.delete(applicationImageTable).where(eq(applicationImageTable.applicationId, applicationId));

            if (input.images.length > 0) {
              await tx.insert(applicationImageTable).values(
                input.images.map(url => ({
                  applicationId,
                  url,
                })),
              );
            }
          }

          return updatedApp;
        }),
      catch: error => new DatabaseError("Failed to edit application", error),
    });
  },
);
