import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";

export const getAppsUseCase = Effect.fn("getAppsUseCase")(
  function* (developerId: string) {
    const db = yield* DatabaseService;
    const applications = yield* Effect.tryPromise(() =>
      db.query.applicationTable.findMany({
        where: eq(applicationTable.developerId, developerId),
        with: {
          images: true,
        },
      }),
    );
    return applications;
  },
);
