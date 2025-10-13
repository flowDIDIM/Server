import { Schema } from "effect";

export const LocalizedTextSchema = Schema.Struct({
  language: Schema.String,
  text: Schema.String,
});

export const ReleaseStatusSchema = Schema.Union(
  Schema.Literal("draft"),
  Schema.Literal("inProgress"),
  Schema.Literal("halted"),
  Schema.Literal("completed"),
);

export const ReleaseSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.optional),
  versionCodes: Schema.String.pipe(Schema.Array, Schema.optional),
  releaseNotes: LocalizedTextSchema.pipe(Schema.Array, Schema.optional),
  status: ReleaseStatusSchema,
  userFraction: Schema.Number.pipe(Schema.optional),
  countryTargeting: Schema.Struct({
    countries: Schema.Array(Schema.String).pipe(Schema.optional),
    includeRestOfWorld: Schema.Boolean.pipe(Schema.optional),
  }).pipe(Schema.optional),
  inAppUpdatePriority: Schema.Number.pipe(Schema.int(), Schema.optional),
});

export const TrackSchema = Schema.Struct({
  track: Schema.String,
  releases: Schema.Array(ReleaseSchema).pipe(Schema.optional),
});
