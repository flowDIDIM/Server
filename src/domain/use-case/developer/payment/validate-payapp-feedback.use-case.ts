import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { DatabaseService } from "@/db";
import { applicationTable, paymentTable } from "@/db/schema";
import { BadRequestError } from "@/domain/error/bad-request-error";
import { NotFoundError } from "@/domain/error/not-found-error";
import { UnauthorizedError } from "@/domain/error/unauthorized-error";
import { env } from "@/lib/env";
import { DatabaseError } from "@/db/errors";
import { FeedbackSchema } from "@/domain/schema/payment/payment-feedback";

/*

Response example
{
  userid: "pretocki3",
  linkkey: "qke/OeE0ZhiPYU3wWJqQ+O1DPJnCCRVaOgT+oqg6zaM=",
  linkval: "qke/OeE0ZhiPYU3wWJqQ+PDKAFSgdhno2PEIi5ev7ZI=",
  goodname: "DIDIM 앱 등록",
  price: "1000",
  recvphone: "01099709915",
  memo: "",
  reqaddr: "0",
  reqdate: "2025-10-04 21:45:58",
  pay_memo: "",
  pay_addr: "",
  pay_date: "2025-10-04 21:46:30",
  pay_type: "16",
  paymethod_group: "25",
  pay_state: "4",
  mul_no: "110495488",
  payurl: "https://www.payapp.kr/z7tCViC",
  csturl: "https://www.payapp.kr/CST/z5th7S7",
  vccode: "",
  donate_name: "",
  donate_identity: "",
  naverpoint: "0",
  naverpay: "card",
  card_name: "하나-외환",
  payauthcode: "47890582",
  cardinst: "0",
  card_quota: "0",
  card_num: "9417-****-****-4252",
  noinf: "n",
  var1: "test_developer_id",
  var2: "test_application_id",
  currency: "krw",
  rebill_no: "",
  buyerid: "",
  amount_taxable: "0",
  amount_taxfree: "1000",
  amount_vat: "0",
  feedbacktype: "0",
}

 */

export const validatePayappFeedbackUseCase = Effect.fn(
  "validatePayappFeedbackUseCase",
)(function* (input: Record<string, string>) {
  const db = yield* DatabaseService;

  const result = yield* Schema.decodeUnknown(FeedbackSchema)(input).pipe(
    Effect.mapError(
      error => new BadRequestError("Invalid request body", error),
    ),
  );

  if (
    result.linkKey !== env.PAYAPP_LINK_KEY ||
    result.linkValue !== env.PAYAPP_LINK_VALUE
  ) {
    return yield* new UnauthorizedError();
  }

  const application = yield* Effect.tryPromise({
    try: () =>
      db.transaction(async tx =>
        tx.query.applicationTable.findFirst({
          where: eq(applicationTable.id, result.applicationId),
        }),
      ),
    catch: error => new DatabaseError("Failed to get application", error),
  });

  if (!application) {
    // TODO: What if application is not found even if payment was successful?
    return yield* new NotFoundError("Application not found");
  }

  if (application.developerId !== result.developerId) {
    return yield* new UnauthorizedError();
  }

  // TODO: Implement setting payment status to paid when succeed

  return result;
});
