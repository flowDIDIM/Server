import { and, eq } from "drizzle-orm";
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
    // 앱이 존재하는지 확인
    const application = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
    });

    if (!application) {
      throw new NotFoundError("Application not found");
    }

    // 이미 가입했는지 확인
    const existingTester = await db.query.testerTable.findFirst({
      where: and(
        eq(testerTable.applicationId, applicationId),
        eq(testerTable.testerId, testerId),
      ),
    });

    if (existingTester) {
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
