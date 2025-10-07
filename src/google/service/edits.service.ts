import { Effect } from "effect";

import { commitEdit } from "@/google/api/edits/commit-edit";
import { insertEdit } from "@/google/api/edits/insert-edit";

export class EditsService extends Effect.Service<EditsService>()(
  "didim/EditsService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      return {
        insert: insertEdit,
        commit: commitEdit,
      } as const;
    }),
  },
) {}
