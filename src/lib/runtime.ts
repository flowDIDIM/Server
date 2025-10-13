import { Effect, Layer, ManagedRuntime } from "effect";

import { DatabaseLayer } from "@/db";
import { FetchHttpClient } from "@effect/platform";
import { EditsService } from "@/google/service/edits.service";
import { ImageService } from "@/google/service/image.service";
import { ListingService } from "@/google/service/listing.service";
import { TestersService } from "@/google/service/testers.service";
import { TracksService } from "@/google/service/tracks.service";

const AppLayer = Layer.empty.pipe(
  Layer.provideMerge(DatabaseLayer),
  Layer.provideMerge(FetchHttpClient.layer),
  Layer.provideMerge(EditsService.Default),
  Layer.provideMerge(ImageService.Default),
  Layer.provideMerge(ListingService.Default),
  Layer.provideMerge(TestersService.Default),
  Layer.provideMerge(TracksService.Default),
);

const appRuntime = ManagedRuntime.make(AppLayer);

type ProvidedRequirements = Layer.Layer.Success<typeof AppLayer>;

export function runAsApp<
  A,
  E,
  R extends ProvidedRequirements = ProvidedRequirements,
>(effect: Effect.Effect<A, E, R>) {
  return effect.pipe(
    Effect.tapDefect(ex => Effect.logError(ex)),
    appRuntime.runPromise,
  );
}
