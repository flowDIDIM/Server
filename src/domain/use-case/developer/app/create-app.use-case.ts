import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { applicationImageTable, applicationTable } from "@/db/schema/application";

interface CreateAppInput {
  developerId: string;
  packageName: string;
  trackName: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  images: string[];
}

export const createAppUseCase = Effect.fn("createAppUseCase")(
  function* (input: CreateAppInput) {
    const db = yield* DatabaseService;
    const {
      developerId,
      packageName,
      trackName,
      title,
      shortDescription,
      fullDescription,
      icon,
      images,
    } = input;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const existingApp = await tx.query.applicationTable.findFirst({
            where: eq(applicationTable.packageName, packageName),
          });

          if (existingApp) {
            throw new Error("Application already exists");
          }

          const [application] = await tx
            .insert(applicationTable)
            .values({
              developerId,
              packageName,
              trackName,
              name: title,
              shortDescription,
              fullDescription,
              icon,
            })
            .returning();

          if (images.length > 0) {
            await tx.insert(applicationImageTable).values(
              images.map(url => ({
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
