import { Schema } from "effect";

export const PaymentTypeSchema = Schema.transformLiterals(
  ["1", "신용카드"],
  ["2", "휴대전화"],
  ["4", "대면결제"],
  ["6", "계좌이체"],
  ["7", "가상계좌"],
  ["15", "카카오페이"],
  ["16", "네이버페이"],
  ["17", "등록결제"],
  ["21", "스마일페이"],
  ["22", "위챗페이"],
  ["23", "애플페이"],
  ["24", "내통장결제"],
  ["25", "토스페이"],
);

export type PaymentType = typeof PaymentTypeSchema.Type;
