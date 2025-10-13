import { Data, Effect } from "effect";

import { EditsService } from "@/google/service/edits.service";

export const isValidPackageNameUseCase = Effect.fn("isValidPackageNameUseCase")(
  function* (packageName: string) {
    return yield* EditsService.insert(packageName).pipe(
      Effect.asVoid,
      Effect.catchTag("InsertEditError", error => {
        console.log("error.cause.status", error.cause.status);

        if (error.cause.status === "NOT_FOUND") {
          return Effect.fail(
            new InvalidPackageNameError({
              message: "존재하지 않는 패키지명입니다!",
            }),
          );
        }

        if (error.cause.status === "PERMISSION_DENIED") {
          return Effect.fail(
            new InvalidPackageNameError({
              message: "권한이 없는 앱입니다!",
            }),
          );
        }

        return Effect.succeedNone;
      }),
    );
  },
);

export class InvalidPackageNameError extends Data.TaggedError(
  "InvalidPackageNameError",
)<{ message: string }> {}
