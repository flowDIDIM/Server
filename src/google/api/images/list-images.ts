import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect } from "effect";
import Schema from "effect/Schema";

import type { AppImageType } from "@/google/schema/image";

import { ErrorSchema } from "@/google/schema/error";
import { ImageSchema } from "@/google/schema/image";

const ResponseSchema = Schema.Union(Schema.Struct({
  images: ImageSchema.pipe(Schema.Array),
}), ErrorSchema);

export function listImages(
  packageName: string,
  editId: string,
  language: string,
  imageType: AppImageType,
) {
  return Effect.gen(function* () {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}/listings/${language}/${imageType}`;
    const result = yield* HttpClient.get(url)
      .pipe(Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)));

    if ("error" in result) {
      return yield* new ListImagesError({
        message: result.error.message,
        cause: result.error,
      });
    }

    return result;
  });
}

export class ListImagesError extends Data.TaggedError("ListImagesError")<{
  message: string;
  cause?: unknown;
}> {}
