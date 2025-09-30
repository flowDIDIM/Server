import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
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

    const existingApp = yield* Effect.tryPromise(() =>
      db.query.applicationTable.findFirst({
        where: eq(applicationTable.packageName, packageName),
      }),
    );

    if (existingApp) {
      return yield* Effect.fail(new Error("Application already exists"));
    }

    const [application] = yield* Effect.tryPromise(() =>
      db
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
        .returning(),
    );

    if (images.length > 0) {
      yield* Effect.tryPromise(() =>
        db.insert(applicationImageTable).values(
          images.map(url => ({
            applicationId: application.id,
            url,
          })),
        ),
      );
    }

    return application;
  },
);
