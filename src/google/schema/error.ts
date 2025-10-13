import { Schema } from "effect";

export const ErrorSchema = Schema.Struct({
  error: Schema.Struct({
    code: Schema.Number,
    message: Schema.String,
    status: Schema.String,
    details: Schema.Struct({
      "@type": Schema.String,
      reason: Schema.String.pipe(Schema.optional),
      domain: Schema.String.pipe(Schema.optional),
      metadata: Schema.Record({
        key: Schema.String,
        value: Schema.String,
      }).pipe(Schema.optional),
    }).pipe(Schema.Array, Schema.optional),
  }),
});

export type GoogleError = Schema.Schema.Type<typeof ErrorSchema>;
