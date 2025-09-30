import { Effect } from "effect";

import { EditsService } from "@/google/service/edits.service";
import { TracksService } from "@/google/service/tracks.service";

export const getTracksUseCase = Effect.fn("getTracksUseCase")(
  function* (packageName: string) {
    const editId = yield* EditsService.insert(packageName);

    const tracks = yield* TracksService.list(packageName, editId);
    return tracks.tracks;
  },
);
