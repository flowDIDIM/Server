import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { NewApplicationWithImage } from "@/db/schema/application";

import { DatabaseService } from "@/db";
import {
  applicationImageTable,
  applicationTable,
} from "@/db/schema/application";
import { ConflictError } from "@/domain/error/conflict-error";
import { mapHttpError } from "@/lib/effect";

export const createAppCompletedUseCase = Effect.fn("createAppCompletedUseCase")(
  function* (input: NewApplicationWithImage) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(() =>
      db.transaction(async tx => {
        const existingApp = await tx.query.applicationTable.findFirst({
          where: eq(applicationTable.packageName, input.packageName),
        });

        if (existingApp) {
          throw new ConflictError(
            "Application with this package name already exists",
          );
        }

        const [application] = await tx
          .insert(applicationTable)
          .values({
            ...input,
            paymentStatus: "COMPLETED",
          })
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
    ).pipe(mapHttpError);
  },
);
