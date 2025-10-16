import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { testerTable } from "@/db/schema/test";
import { ConflictError } from "@/domain/error/conflict-error";
import { NotFoundError } from "@/domain/error/not-found-error";
import { mapHttpError } from "@/lib/effect";

export const joinAppTestUseCase = Effect.fn("joinAppTestUseCase")(function* (
  applicationId: string,
  testerId: string,
) {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise(async () => {
    // 앱과 기존 테스터 등록 여부를 한 번에 조회
    const application = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
      with: {
        testers: {
          where: eq(testerTable.testerId, testerId),
        },
      },
    });

    if (!application) {
      throw new NotFoundError("Application not found");
    }

    // 이미 가입했는지 확인
    if (application.testers.length > 0) {
      throw new ConflictError("Already joined this app test");
    }

    // 테스터 등록
    const [tester] = await db
      .insert(testerTable)
      .values({
        applicationId,
        testerId,
      })
      .returning();

    return tester;
  }).pipe(mapHttpError);
});
