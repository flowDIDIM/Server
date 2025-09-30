import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { applicationTable } from "@/db/schema/application";

export const getAppsUseCase = Effect.fn("getAppsUseCase")(
  function* (developerId: string) {
    const db = yield* DatabaseService;
    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async tx =>
          tx.query.applicationTable.findMany({
            where: eq(applicationTable.developerId, developerId),
            with: {
              images: true,
            },
          }),
        ),
      catch: error => new DatabaseError("Failed to get applications", error),
    });
  },
);
