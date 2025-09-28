import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect } from "effect";
import Schema from "effect/Schema";

import { ErrorSchema } from "@/google/schema/error";
import { TrackSchema } from "@/google/schema/track";

const ResponseSchema = Schema.Union(Schema.Struct({
  kind: Schema.String,
  tracks: Schema.Array(TrackSchema),
}), ErrorSchema);

export function listTracks(
  packageName: string,
  editId: string,
) {
  return Effect.gen(function* () {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/tracks`;
    const result = yield* HttpClient.get(url)
      .pipe(Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)));

    if ("error" in result) {
      return yield* new ListTracksError({
        message: result.error.message,
        cause: result.error,
      });
    }

    return result;
  });
}

export class ListTracksError extends Data.TaggedError("ListTracksError")<{
  message: string;
  cause?: unknown;
}> {
}
