import Schema from "effect/Schema";

export const EditIdSchema = Schema.String.pipe(Schema.brand("EditId"));

export const AppEditSchema = Schema.Struct({
  id: EditIdSchema,
  expiryTimeSeconds: Schema.String,
});

export type AppEdit = Schema.Schema.Type<typeof AppEditSchema>;
