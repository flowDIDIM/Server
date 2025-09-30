import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationImageTable, applicationTable } from "@/db/schema/application";

interface EditAppInput {
  applicationId: string;
  name?: string;
  shortDescription?: string;
  fullDescription?: string;
  icon?: string;
  trackName?: string;
  images?: string[];
}

export const editAppUseCase = Effect.fn("editAppUseCase")(
  function* (input: EditAppInput) {
    const db = yield* DatabaseService;
    const { applicationId, ...updateData } = input;

    const existingApp = yield* Effect.tryPromise(() =>
      db.query.applicationTable.findFirst({
        where: eq(applicationTable.id, applicationId),
      }),
    );

    if (!existingApp) {
      return yield* Effect.fail(new Error("Application not found"));
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined),
    );

    if (Object.keys(filteredUpdateData).length === 0) {
      return existingApp;
    }

    const [updatedApp] = yield* Effect.tryPromise(() =>
      db
        .update(applicationTable)
        .set(filteredUpdateData)
        .where(eq(applicationTable.id, applicationId))
        .returning(),
    );

    if (input.images !== undefined) {
      yield* Effect.tryPromise(() =>
        db.delete(applicationImageTable).where(eq(applicationImageTable.applicationId, applicationId)),
      );

      if (input.images.length > 0) {
        yield* Effect.tryPromise(() =>
          db.insert(applicationImageTable).values(
            input.images.map(url => ({
              applicationId,
              url,
            })),
          ),
        );
      }
    }

    return updatedApp;
  },
);
