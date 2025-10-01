import { Effect, Layer, ManagedRuntime } from "effect";

import { DatabaseService, db } from "@/db";

const AppLayer = Layer.succeed(DatabaseService, db);

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
