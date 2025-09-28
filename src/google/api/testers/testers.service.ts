import { Effect } from "effect";

import { patchTester } from "@/google/api/testers/patch-tester";

export class TestersService extends Effect.Service<TestersService>()("didim/TestersService", {
  accessors: true,
  effect: Effect.gen(function* () {
    return {
      patch: patchTester,
    } as const;
  }),
}) {}
