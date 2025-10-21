import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { userTable } from "@/db/schema/auth";
import { userPointTable } from "@/db/schema/point";
import { mapHttpError } from "@/lib/effect";
import { NotFoundError } from "@/domain/error/not-found-error";

export const getUserInfoUseCase = Effect.fn("getUserInfoUseCase")(function* (
  userId: string,
) {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise(async () => {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const userPoint = await db.query.userPointTable.findFirst({
      where: eq(userPointTable.userId, userId),
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      points: userPoint?.balance ?? 0,
    };
  }).pipe(mapHttpError);
});
