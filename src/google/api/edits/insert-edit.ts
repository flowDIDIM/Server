import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect } from "effect";
import Schema from "effect/Schema";

import { AppEditSchema, EditIdSchema } from "@/google/schema/app-edit";
import { ErrorSchema } from "@/google/schema/error";

const ResponseSchema = Schema.Union(AppEditSchema, ErrorSchema);

export function insertEdit(packageName: string) {
  return Effect.gen(function* () {
    const result = yield* HttpClient.post(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits`)
      .pipe(Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)));

    if ("error" in result) {
      return yield* new InsertEditError({
        message: result.error.message,
        cause: result.error,
      });
    }

    return EditIdSchema.make(result.id);
  });
}

export class InsertEditError extends Data.TaggedError("InsertEditError")<{
  message: string;
  cause?: unknown;
}> {}
