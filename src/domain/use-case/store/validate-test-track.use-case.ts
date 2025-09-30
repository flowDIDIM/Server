import { Config, Effect } from "effect";

import { EditsService } from "@/google/service/edits.service";
import { TestersService } from "@/google/service/testers.service";

export const validateTestTrackUseCase = Effect.fn("validateTestTrackUseCase")(
  function* (packageName: string, track: string) {
    const googleGroups = yield* Config.string("VALID_GOOGLE_GROUPS");
    const editId = yield* EditsService.insert(packageName);
    const testers = yield* TestersService.get(packageName, editId, track);

    return testers.includes(googleGroups);
  },
);
