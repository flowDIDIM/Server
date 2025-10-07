import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { gifticonPurchaseTable } from "@/db/schema/gifticon";

export const getMyGifticonsUseCase = Effect.fn("getMyGifticonsUseCase")(
  function* (userId: string) {
    const db = yield* DatabaseService;

    return yield* Effect.tryPromise({
      try: () =>
        db.transaction(async tx => {
          const purchases = await tx.query.gifticonPurchaseTable.findMany({
            where: eq(gifticonPurchaseTable.userId, userId),
            with: {
              product: true,
            },
            orderBy: (purchase, { desc }) => [desc(purchase.createdAt)],
          });

          return purchases;
        }),
      catch: error => new DatabaseError("Failed to get my gifticons", error),
    });
  },
);
