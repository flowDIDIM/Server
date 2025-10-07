import { Effect, Layer, ManagedRuntime } from "effect";

import { DatabaseLayer, DatabaseService, db } from "@/db";
import { FetchHttpClient } from "@effect/platform";

const AppLayer = Layer.empty.pipe(
  Layer.provideMerge(DatabaseLayer),
  Layer.provideMerge(FetchHttpClient.layer),
);

const appRuntime = ManagedRuntime.make(AppLayer);

type ProvidedRequirements = Layer.Layer.Success<typeof AppLayer>;

export function runAsApp<
  A,
  E extends never,
  R extends ProvidedRequirements = ProvidedRequirements,
>(effect: Effect.Effect<A, E, R>) {
  return effect.pipe(
    Effect.tapDefect(ex => Effect.logError(ex)),
    appRuntime.runPromise,
  );
}
