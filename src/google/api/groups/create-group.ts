import { HttpBody, HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect } from "effect";
import Schema from "effect/Schema";

import { ErrorSchema } from "@/google/schema/error";
import { GroupSchema } from "@/google/schema/groups";

const ResponseSchema = Schema.Union(Schema.Struct({
  done: Schema.Boolean,
  response: GroupSchema,
}), ErrorSchema);

export function createGroups(
  groupEmail: string,
  customerId: string,
  displayName: string,
  description: string = "",
) {
  return Effect.gen(function* () {
    const result = yield* HttpClient.post(`https://cloudidentity.googleapis.com/v1/groups?initialGroupConfig=WITH_INITIAL_OWNER`, {
      body: yield* HttpBody.json({
        displayName,
        description,
        groupKey: {
          id: groupEmail,
        },
        labels: {
          "cloudidentity.googleapis.com/groups.discussion_forum": "",
        },
        parent: `customers/${customerId}`,
      }),
    }).pipe(Effect.andThen(HttpClientResponse.schemaBodyJson(ResponseSchema)));

    if ("error" in result) {
      return yield* new CreateGroupsError({
        message: result.error.message,
        cause: result.error,
      });
    }

    return result;
  });
}

export class CreateGroupsError extends Data.TaggedError("CreateGroupsError")<{
  message: string;
  cause?: unknown;
}> {
}
