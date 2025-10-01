import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { NewApplication } from "@/db/schema/application";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { applicationImageTable, applicationTable } from "@/db/schema/application";

export const createAppUseCase = Effect.fn("createAppUseCase")(
  function* (input: NewApplication & { images: string[] }) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const existingApp = await tx.query.applicationTable.findFirst({
            where: eq(applicationTable.packageName, input.packageName),
          });

          if (existingApp) {
            throw new Error("Application already exists");
          }

          const [application] = await tx
            .insert(applicationTable)
            .values(input)
            .returning();

          if (input.images.length > 0) {
            await tx.insert(applicationImageTable).values(
              input.images.map(url => ({
                applicationId: application.id,
                url,
              })),
            );
          }

          return application;
        }),
      catch: error => new DatabaseError("Failed to create application", error),
    });
  },
);
