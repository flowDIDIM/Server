import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect, Schema } from "effect";

import { ErrorSchema } from "@/google/schema/error";
import { TestersSchema } from "@/google/schema/testers";

const ResponseSchema = Schema.Union(TestersSchema, ErrorSchema);

export const getTester = Effect.fn("getTester")(function* (
  packageName: string,
  editId: string,
  track: string,
) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/testers/${track}`;
  const result = yield* HttpClient.get(url).pipe(
    Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)),
  );

  if ("error" in result) {
    return yield* new GetTestersError({
      message: result.error.message,
      cause: result.error,
    });
  }

  return result.googleGroups ?? [];
});

export class GetTestersError extends Data.TaggedError("GetTestersError")<{
  message: string;
  cause?: unknown;
}> {}
