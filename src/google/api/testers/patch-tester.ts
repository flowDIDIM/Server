import { HttpBody, HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect } from "effect";
import Schema from "effect/Schema";

import type { Testers } from "@/google/schema/testers";

import { ErrorSchema } from "@/google/schema/error";
import { TestersSchema } from "@/google/schema/testers";

const ResponseSchema = Schema.Union(TestersSchema, ErrorSchema);

export const patchTester = Effect.fn("patchTester")(function* (
  packageName: string,
  editId: string,
  track: string,
  testers: Testers = { googleGroups: [] },
) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/testers/${track}`;
  const result = yield* HttpClient.post(url, {
    body: yield* HttpBody.jsonSchema(TestersSchema)(testers),
  }).pipe(Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)));

  if ("error" in result) {
    return yield* new PatchTestersError({
      message: result.error.message,
      cause: result.error,
    });
  }

  return result;
});

export class PatchTestersError extends Data.TaggedError("PatchTestersError")<{
  message: string;
  cause?: unknown;
}> {
}
