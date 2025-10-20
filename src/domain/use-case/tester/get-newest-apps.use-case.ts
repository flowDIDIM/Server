import { and, desc, eq, sql } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { mapHttpError } from "@/lib/effect";
import { DEFAULT_TESTER_COUNT } from "@/domain/constants/test-config";

export const getNewestAppsUseCase = Effect.fn("getNewestAppsUseCase")(
  function* () {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(async () => {
      // 가장 최근에 추가된 앱 3개 가져오기
      const apps = await db.query.applicationTable.findMany({
        where: and(
          eq(applicationTable.status, "ONGOING"),
          eq(applicationTable.paymentStatus, "COMPLETED"),
        ),
        with: {
          testers: true,
        },
        orderBy: [desc(applicationTable.createdAt)],
      });

      // 테스터 수가 정원 미만인 앱만 필터링하고 최대 3개 반환
      return apps
        .filter(app => app.testers.length < DEFAULT_TESTER_COUNT)
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
