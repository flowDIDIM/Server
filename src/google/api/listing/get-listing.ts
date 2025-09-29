import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect } from "effect";
import Schema from "effect/Schema";

import { ErrorSchema } from "@/google/schema/error";
import { ListingSchema } from "@/google/schema/listing";

const ResponseSchema = Schema.Union(ListingSchema, ErrorSchema);

export function getListing(packageName: string, editId: string, language: string) {
  return Effect.gen(function* () {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/listings/${language}`;
    const result = yield* HttpClient.get(url)
      .pipe(Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)));

    if ("error" in result) {
      return yield* new GetListingError({
        message: result.error.message,
        cause: result.error,
      });
    }

    return result;
  });
}

export class GetListingError extends Data.TaggedError("GetListingError")<{
  message: string;
  cause?: unknown;
}> {}
