import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { gifticonProductTable } from "@/db/schema/gifticon";

export const getGifticonProductsUseCase = Effect.fn(
  "getGifticonProductsUseCase",
)(function* () {
  const db = yield* DatabaseService;

  return yield* Effect.tryPromise({
    try: () =>
      db.transaction(async tx => {
        const products = await tx.query.gifticonProductTable.findMany({
          where: eq(gifticonProductTable.isAvailable, true),
          orderBy: (product, { asc }) => [asc(product.price)],
        });

        return products;
      }),
    catch: error => new DatabaseError("Failed to get gifticon products", error),
  });
});
