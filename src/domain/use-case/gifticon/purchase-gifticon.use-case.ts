import { eq } from "drizzle-orm";
import { Data, Effect } from "effect";

import { DatabaseService } from "@/db";
import { DatabaseError } from "@/db/errors";
import { gifticonProductTable, gifticonPurchaseTable } from "@/db/schema/gifticon";
import { pointHistoryTable, userPointTable } from "@/db/schema/point";

interface PurchaseGifticonInput {
  userId: string;
  productId: string;
}

export const purchaseGifticonUseCase = Effect.fn("purchaseGifticonUseCase")(
  function* (input: PurchaseGifticonInput) {
    const db = yield* DatabaseService;

    const effect = Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const product = await tx.query.gifticonProductTable.findFirst({
            where: eq(gifticonProductTable.id, input.productId),
          });

          if (!product) {
            throw new ProductNotFoundError();
          }

          if (!product.isAvailable) {
            throw new ProductNotAvailableError();
          }

          const userPoint = await tx.query.userPointTable.findFirst({
            where: eq(userPointTable.userId, input.userId),
          });

          if (!userPoint) {
            throw new UserPointNotFoundError();
          }

          if (userPoint.balance < product.price) {
            throw new InsufficientPointError();
          }

          const newBalance = userPoint.balance - product.price;

          await tx
            .update(userPointTable)
            .set({ balance: newBalance })
            .where(eq(userPointTable.userId, input.userId));

          await tx.insert(pointHistoryTable).values({
            userId: input.userId,
            amount: product.price,
            type: "spend",
            reason: `기프티콘 구매: ${product.name}`,
            balance: newBalance,
          });

          const [purchase] = await tx
            .insert(gifticonPurchaseTable)
            .values({
              userId: input.userId,
              productId: input.productId,
              price: product.price,
              status: "completed",
            })
            .returning();

          return purchase;
        }),
      catch: (error) => {
        if (error instanceof InsufficientPointError) {
          return error;
        }
        if (error instanceof ProductNotFoundError) {
          return error;
        }
        if (error instanceof ProductNotAvailableError) {
          return error;
        }
        if (error instanceof UserPointNotFoundError) {
          return error;
        }
        if (error instanceof InsufficientPointError) {
          return error;
        }
        if (error instanceof PurchaseGifticonError) {
          return error;
        }
        return new DatabaseError("Failed to purchase gifticon", error);
      },
    });
	
    return yield* effect;
  },
);

export class ProductNotFoundError extends Data.TaggedError("ProductNotFoundError") {}
export class ProductNotAvailableError extends Data.TaggedError("ProductNotAvailableError") {}
export class UserPointNotFoundError extends Data.TaggedError("UserPointNotFoundError") {}
export class InsufficientPointError extends Data.TaggedError("InsufficientPointError") {}
export class PurchaseGifticonError extends Data.TaggedError("PurchaseGifticonError") {}
