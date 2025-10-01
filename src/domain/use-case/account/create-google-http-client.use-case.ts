import { HttpClient, HttpClientRequest } from "@effect/platform";
import { eq } from "drizzle-orm";
import { Data, Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { accountTable } from "@/db/schema";

export const createGoogleHttpClientUseCase = Effect.fn("createGoogleHttpClientUseCase")(
  function* (developerId: string) {
    const db = yield* DatabaseService;
    const account = yield* Effect.tryPromise({
      try: () => db.query.accountTable.findFirst({
        where: eq(accountTable.userId, developerId),
      }),
      catch: error => new DatabaseError("Failed to fetch Google account", { cause: error }),
    });

    if (!account) {
      return yield* new AccountNotFoundError();
    }

    const httpClient = yield* HttpClient.HttpClient;
    const accessToken = account.accessToken;

    return httpClient.pipe(
      HttpClient.mapRequest(request => request.pipe(HttpClientRequest.setHeader("Authorization", `Bearer ${accessToken}`))),
    );
  },
);

export class AccountNotFoundError extends Data.TaggedError("AccountNotFoundError") {
}
