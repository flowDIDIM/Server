import Schema from "effect/Schema";

export const GroupSchema = Schema.Struct({
  name: Schema.String,
  groupKey: Schema.Struct({
    id: Schema.String,
  }),
  parent: Schema.String,
  displayName: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  createTime: Schema.String,
  updateTime: Schema.String,
  labels: Schema.Record({
    key: Schema.String,
    value: Schema.String,
  }).pipe(Schema.optional),
});
