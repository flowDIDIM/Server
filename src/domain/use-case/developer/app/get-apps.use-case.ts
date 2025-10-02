import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { mapHttpError } from "@/lib/effect";

export const getAppsUseCase = Effect.fn("getAppsUseCase")(
  function* (developerId: string) {
    const db = yield* DatabaseService;
    return yield* Effect.tryPromise(
      () => db.transaction(async tx =>
        tx.query.applicationTable.findMany({
          where: eq(applicationTable.developerId, developerId),
          with: {
            images: true,
          },
        }),
      ),
    ).pipe(mapHttpError);
  },
);
