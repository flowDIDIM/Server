import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { Application } from "@/db/schema/application";

import { DatabaseService } from "@/db";
import { applicationImageTable, applicationTable } from "@/db/schema/application";
import { NotFoundError } from "@/domain/error/not-found-error";
import { UnauthorizedError } from "@/domain/error/unauthorized-error";
import { mapHttpError } from "@/lib/effect";

export const patchAppUseCase = Effect.fn("patchAppUseCase")(
  function* (applicationId: string, developerId: string, input: Partial<Application & { images: string[] }>) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(
      () => db.transaction(async (tx) => {
        const existingApp = await tx.query.applicationTable.findFirst({
          where: eq(applicationTable.id, applicationId),
        });

        if (!existingApp) {
          throw new NotFoundError("Application not found");
        }

        if (existingApp.developerId !== developerId) {
          throw new UnauthorizedError();
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
    ).pipe(mapHttpError);
  },
);
