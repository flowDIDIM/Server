import { Effect } from "effect";

import { getTester } from "@/google/api/testers/get-tester";
import { patchTester } from "@/google/api/testers/patch-tester";

export class TestersService extends Effect.Service<TestersService>()("didim/TestersService", {
  accessors: true,
  effect: Effect.gen(function* () {
    return {
      get: getTester,
      patch: patchTester,
    } as const;
  }),
}) {}
