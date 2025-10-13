import { Data, Effect } from "effect";

import { EditsService } from "@/google/service/edits.service";

export const isValidPackageNameUseCase = Effect.fn("isValidPackageNameUseCase")(
  function* (packageName: string) {
    return yield* EditsService.insert(packageName).pipe(
      Effect.asVoid,
      Effect.catchAll(() => Effect.fail(new InvalidPackageNameError())),
    );
  },
);

export class InvalidPackageNameError extends Data.TaggedError(
  "InvalidPackageNameError",
) {}
