import { z } from "zod";

// Payment webhook schema based on the new payment provider
export const PaymentWebhookSchema = z.object({
  type: z.enum(["NORMAL_PAYMENT", "MEMBERSHIP_PAYMENT"]),
  payment: z.object({
    name: z.string(),
    email: z.email(),
    phoneNumber: z.string(),
    amount: z.number(),
    status: z.enum(["SUCCESS", "CANCEL"]),
    date: z.iso.datetime(),
    method: z.string().optional(),
    canceledReason: z.string().optional(),
    option: z.string().optional(),
    forms: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional()
      .default([]),
    agreements: z
      .array(
        z.object({
          question: z.string(),
          answer: z.boolean(),
        }),
      )
      .optional()
      .default([]),
  }),
});

export type PaymentWebhook = z.infer<typeof PaymentWebhookSchema>;
export type PaymentWebhookPayment = PaymentWebhook["payment"];
