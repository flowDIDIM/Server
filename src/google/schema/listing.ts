import { Schema } from "effect";

export const ListingSchema = Schema.Struct({
  language: Schema.String,
  title: Schema.String,
  fullDescription: Schema.String,
  shortDescription: Schema.String,
  video: Schema.String,
});
