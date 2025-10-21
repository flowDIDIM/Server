import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { testerTable } from "@/db/schema/test";
import { mapHttpError } from "@/lib/effect";
import { DEFAULT_TESTER_COUNT } from "@/domain/constants/test-config";
import { NotFoundError } from "@/domain/error/not-found-error";

export const getAppDetailUseCase = Effect.fn("getAppDetailUseCase")(function* (
  applicationId: string,
  userId: string | null,
) {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise(async () => {
    const app = await db.query.applicationTable.findFirst({
      where: eq(applicationTable.id, applicationId),
      with: {
        images: true,
        testers: true,
      },
    });

    if (!app) {
      throw new NotFoundError("Application not found");
    }

    // Check if user has joined this app
    let testerInfo = null;
    if (userId) {
      const tester = await db.query.testerTable.findFirst({
        where: and(
          eq(testerTable.applicationId, applicationId),
          eq(testerTable.testerId, userId),
        ),
        with: {
          logs: {
            orderBy: (logs, { desc }) => [desc(logs.testedAt)],
          },
        },
      });

      if (tester) {
        const completedDays = tester.logs.length;
        const today = new Date().toISOString().split("T")[0];

        // Check if today's test is completed
        const todayLog = tester.logs.find(log => log.testedAt === today);
        const isTodayCompleted = !!todayLog;

        // Calculate progress rate (assuming 7 days total)
        const totalDays = 7;
        const progressRate = Math.round((completedDays / totalDays) * 100);

        // Build daily tasks array
        const dailyTasks = Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const logForDay = tester.logs.find(
            (_, index) => tester.logs.length - index === day,
          );

          let status: "completed" | "incomplete" | "pending" = "pending";
          if (logForDay) {
            status = "completed";
          } else if (day <= completedDays + 1) {
            status = "incomplete";
          }

          return { day, status };
        });

        testerInfo = {
          isJoined: true,
          status: tester.status,
          currentDay: completedDays + 1,
          completedDays,
          progressRate,
          isTodayCompleted,
          dailyTasks,
        };
      }
    }

    return {
      id: app.id,
      name: app.name,
      shortDescription: app.shortDescription,
      fullDescription: app.fullDescription,
      icon: app.icon,
      screenshots: app.images.map(img => img.url),
      earnedPoints: app.price,
      testerCount: app.testers.length,
      testerCapacity: DEFAULT_TESTER_COUNT,
      isJoined: !!testerInfo,
      testerInfo,
    };
  }).pipe(mapHttpError);
});
