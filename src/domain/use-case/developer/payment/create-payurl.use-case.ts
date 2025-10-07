import { HttpBody, HttpClient, HttpClientResponse } from "@effect/platform";
import { Effect, Schema } from "effect";

import { NewApplicationWithImageSchema } from "@/db/schema";

import { BadRequestError } from "@/domain/error/bad-request-error";
import { env } from "@/lib/env";
import { createAppUseCase } from "@/domain/use-case/developer/app/create-app.use-case";
import { z } from "zod";

export const CreatePayUrlUseCaseInputSchema = z.object({
  applicationId: z.string(),
  developerId: z.string(),
  phoneNumber: z.string(),
  amount: z.number(),
});

export type CreatePayUrlUseCaseInput = z.infer<
  typeof CreatePayUrlUseCaseInputSchema
>;

const ResponseSchema = Schema.Union(
  Schema.Struct({
    state: Schema.Literal("0"),
    errorMessage: Schema.String,
    errNo: Schema.String,
    errNoDetail: Schema.String,
  }),
  Schema.Struct({
    state: Schema.Literal("1"),
    mul_no: Schema.String,
    payurl: Schema.String,
    qrurl: Schema.String,
  }),
);

export const createPayUrlUseCase = Effect.fn("createPayUrlUseCase")(function* (
  input: CreatePayUrlUseCaseInput,
) {
  const { amount, applicationId, developerId, phoneNumber } = input;

  if (amount < env.MINIMUM_PAYMENT_AMOUNT) {
    return yield* new BadRequestError("최소 1만원 이상 결제해야 합니다.");
  }

  const response = yield* HttpClient.post(
    `${env.PAYAPP_URL}/oapi/apiLoad.html`,
    {
      body: HttpBody.urlParams([
        ["cmd", "payrequest"],
        ["userid", env.PAYAPP_USER_ID],
        ["goodname", "앱 등록"],
        ["price", amount.toString()],
        ["recvphone", phoneNumber],
        ["smsuse", "n"],
        ["skip_cstpage", "y"],
        ["feedbackurl", `${env.SERVER_URL}/developer/payment/feedback`],
        ["returnurl", `${env.SERVER_URL}/developer/payment/return`],
        ["var1", developerId],
        ["var2", applicationId],
      ]),
    },
  ).pipe(
    Effect.andThen(HttpClientResponse.schemaBodyUrlParams(ResponseSchema)),
  );

  if (response.state === "0") {
    return yield* new BadRequestError(
      `결제 요청 실패: ${response.errorMessage} (${response.errNo} ${response.errNoDetail})`,
    );
  }

  return { url: response.payurl };
});
