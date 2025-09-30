import { Effect } from "effect";

import { EditsService } from "@/google/service/edits.service";

export const isValidPackageNameUseCase = Effect.fn("isValidPackageNameUseCase")(
  function* (packageName: string) {
    return yield* EditsService.insert(packageName).pipe(
      Effect.map(() => true),
      Effect.catchAll(() => Effect.succeed(false)),
    );
  },
);
