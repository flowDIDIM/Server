import { Schema } from "effect";

export const TestersSchema = Schema.Struct({
  googleGroups: Schema.String.pipe(Schema.Array, Schema.optional),
});

export type Testers = Schema.Schema.Type<typeof TestersSchema>;
