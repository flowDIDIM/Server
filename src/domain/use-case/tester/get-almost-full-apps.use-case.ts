import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { mapHttpError } from "@/lib/effect";
import { DEFAULT_TESTER_COUNT } from "@/domain/constants/test-config";

export const getAlmostFullAppsUseCase = Effect.fn("getAlmostFullAppsUseCase")(
  function* () {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(async () => {
      // 정원에 가장 가까운 앱 3개 가져오기 (테스터 수가 많은 순)
      const apps = await db.query.applicationTable.findMany({
        where: and(
          eq(applicationTable.status, "ONGOING"),
          eq(applicationTable.paymentStatus, "COMPLETED"),
        ),
        with: {
          testers: true,
        },
      });

      // 테스터 수가 정원 미만인 앱만 필터링하고 테스터 수가 많은 순으로 정렬 후 최대 3개 반환
      return apps
        .filter(app => app.testers.length < DEFAULT_TESTER_COUNT)
        .sort((a, b) => b.testers.length - a.testers.length)
        .slice(0, 3)
        .map(app => ({
          id: app.id,
          name: app.name,
          icon: app.icon,
          shortDescription: app.shortDescription,
          earnedPoints: app.price,
          testerCount: app.testers.length,
          testerCapacity: DEFAULT_TESTER_COUNT,
        }));
    }).pipe(mapHttpError);
  },
);
