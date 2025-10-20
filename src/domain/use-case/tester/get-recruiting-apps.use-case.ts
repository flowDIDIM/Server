import { and, desc, eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable } from "@/db/schema/application";
import { mapHttpError } from "@/lib/effect";
import { DEFAULT_TESTER_COUNT } from "@/domain/constants/test-config";

export const getRecruitingAppsUseCase = Effect.fn("getRecruitingAppsUseCase")(
  function* (page: number, pageSize: number) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise(async () => {
      const offset = (page - 1) * pageSize;

      // 모집중인 앱만 가져오기 (status가 ONGOING이고 payment가 완료된 앱)
      const allApps = await db.query.applicationTable.findMany({
        where: and(
          eq(applicationTable.status, "ONGOING"),
          eq(applicationTable.paymentStatus, "COMPLETED"),
        ),
        with: {
          testers: true,
        },
        orderBy: [desc(applicationTable.createdAt)],
      });

      // 테스터 수가 정원 미만인 앱만 필터링
      const recruitingApps = allApps.filter(
        app => app.testers.length < DEFAULT_TESTER_COUNT,
      );

      // 페이지네이션 적용
      const paginatedApps = recruitingApps.slice(offset, offset + pageSize);

      return {
        apps: paginatedApps.map(app => ({
          id: app.id,
          name: app.name,
          icon: app.icon,
          shortDescription: app.shortDescription,
          earnedPoints: app.price,
          testerCount: app.testers.length,
          testerCapacity: DEFAULT_TESTER_COUNT,
        })),
        pagination: {
          page,
          pageSize,
          total: recruitingApps.length,
          totalPages: Math.ceil(recruitingApps.length / pageSize),
        },
      };
    }).pipe(mapHttpError);
  },
);
