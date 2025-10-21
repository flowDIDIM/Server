import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { testerTable } from "@/db/schema/test";
import { mapHttpError } from "@/lib/effect";
import { format } from "date-fns";

export const getIncompleteTestsUseCase = Effect.fn("getIncompleteTestsUseCase")(
  function* (userId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      // Get all apps the user is participating in
      const testers = await db.query.testerTable.findMany({
        where: and(
          eq(testerTable.testerId, userId),
          eq(testerTable.status, "ONGOING"),
        ),
        with: {
          application: true,
          logs: {
            orderBy: (logs, { desc }) => [desc(logs.testedAt)],
          },
        },
      });

      // Filter for incomplete tests today
      const incompleteTests = testers.filter(tester => {
        const todayLog = tester.logs.find(log => log.testedAt === today);
        return !todayLog; // Return apps that don't have today's log
      });

      return incompleteTests.map(tester => ({
        applicationId: tester.application.id,
        name: tester.application.name,
        icon: tester.application.icon,
        shortDescription: tester.application.shortDescription,
        earnedPoints: tester.application.price,
      }));
    }).pipe(mapHttpError);
  },
);
