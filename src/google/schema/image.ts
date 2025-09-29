import Schema from "effect/Schema";

export const ImageSchema = Schema.Struct({
  id: Schema.String,
  url: Schema.String,
  sha1: Schema.String,
  sha256: Schema.String,
});

export const AppImageTypeSchema = Schema.Union(
  Schema.Literal("appImageTypeUnspecified"),
  Schema.Literal("phoneScreenshots"),
  Schema.Literal("sevenInchScreenshots"),
  Schema.Literal("tenInchScreenshots"),
  Schema.Literal("tvScreenshots"),
  Schema.Literal("wearScreenshots"),
  Schema.Literal("icon"),
  Schema.Literal("featureGraphic"),
  Schema.Literal("tvBanner"),
);

export type AppImageType = Schema.Schema.Type<typeof AppImageTypeSchema>;
