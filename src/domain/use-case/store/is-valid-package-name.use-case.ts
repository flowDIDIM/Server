import { Data, Effect } from "effect";

import { EditsService } from "@/google/service/edits.service";
import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DatabaseError } from "@/db/errors";

export const isValidPackageNameUseCase = Effect.fn("isValidPackageNameUseCase")(
  function* (packageName: string) {
    // 구글 플레이 콘솔에서 올바른 패키지인지 확인
    yield* EditsService.insert(packageName).pipe(
      Effect.asVoid,
      Effect.catchTag("InsertEditError", error => {
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

    // D에서 올바른 패키지인지 확인
    const db = yield* DatabaseService;
    const existApp = yield* Effect.tryPromise({
      try: () =>
        db.query.applicationTable.findFirst({
          where: eq(applicationTable.packageName, packageName),
        }),
      catch: error =>
        new DatabaseError(
          `Failed to find application that has package name of ${packageName}`,
          error,
        ),
    });

    if (existApp) {
      return yield* Effect.fail(
        new InvalidPackageNameError({
          message: "이미 등록된 패키지명입니다!",
        }),
      );
    }
  },
);

export class InvalidPackageNameError extends Data.TaggedError(
  "InvalidPackageNameError",
)<{ message: string }> {}
