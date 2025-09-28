import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect } from "effect";
import Schema from "effect/Schema";

import { AppEditSchema } from "@/google/schema/app-edit";
import { ErrorSchema } from "@/google/schema/error";

const ResponseSchema = Schema.Union(AppEditSchema, ErrorSchema);

export function commitEdit(
  packageName: string,
  editId: string,
  changesNotSentForReview: boolean = false,
) {
  return Effect.gen(function* () {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits/${editId}:commit&changesNotSentForReview=${changesNotSentForReview}`;
    const result = yield* HttpClient.post(url)
      .pipe(Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)));

    if ("error" in result) {
      return yield* new CommitEditError({
        message: result.error.message,
        cause: result.error,
      });
    }

    return result;
  });
}

export class CommitEditError extends Data.TaggedError("CommitEditError")<{
  message: string;
  cause?: unknown;
}> {
}
