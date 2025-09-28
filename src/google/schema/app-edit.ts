import Schema from "effect/Schema";

export const AppEditSchema = Schema.Struct({
  id: Schema.String,
  expiryTimeSeconds: Schema.String,
});

export type AppEdit = Schema.Schema.Type<typeof AppEditSchema>;
