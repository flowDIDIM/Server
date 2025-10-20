import { desc, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { testerTable } from "@/db/schema/test";
import { mapHttpError } from "@/lib/effect";
import { differenceInDays, format } from "date-fns";

export const getMyAppsUseCase = Effect.fn("getMyAppsUseCase")(function* (
  testerId: string,
) {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise(async () => {
    const testers = await db.query.testerTable.findMany({
      where: eq(testerTable.testerId, testerId),
      with: {
        application: true,
        logs: {
          orderBy: (logs, { desc }) => [desc(logs.testedAt)],
        },
      },
      orderBy: [desc(testerTable.createdAt)],
    });

    const today = format(new Date(), "yyyy-MM-dd");

    return testers.map(tester => {
      const completedDays = tester.logs.length;
      const lastLogDate = tester.logs[0]?.testedAt;

      // 이탈 정보 계산
      let droppedInfo = null;
      if (tester.status === "DROPPED" && lastLogDate) {
        const daysSinceLastLog = differenceInDays(
          new Date(today),
          new Date(lastLogDate),
        );
        droppedInfo = {
          lastLogDate,
          daysSinceLastLog,
        };
      }

      return {
        applicationId: tester.application.id,
        name: tester.application.name,
        icon: tester.application.icon,
        shortDescription: tester.application.shortDescription,
        earnedPoints: tester.application.price,
        status: tester.status,
        completedDays,
        droppedInfo,
      };
    });
  }).pipe(mapHttpError);
});
