import { Schema } from "effect";

export const PaymentStatusSchema = Schema.transformLiterals(
  ["1", "요청"],
  ["4", "결제완료"],
  ["8", "요청취소"],
  ["32", "요청취소"],
  ["9", "승인취소"],
  ["64", "승인취소"],
  ["10", "결제대기"],
  ["70", "부분취소"],
  ["71", "부분취소"],
);

export type PaymentStatus = typeof PaymentStatusSchema.Type;

export const PaymentStatusValueList = [
  ...new Set(PaymentStatusSchema.members.map(t => t.to.literals[0])),
] as ["요청", "결제완료", "요청취소", "승인취소", "결제대기", "부분취소"];
