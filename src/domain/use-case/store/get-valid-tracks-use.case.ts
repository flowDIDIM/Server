import { Data, Effect } from "effect";

import { EditsService } from "@/google/service/edits.service";
import { TracksService } from "@/google/service/tracks.service";

export const getValidTracksUseCase = Effect.fn("getValidTracksUseCase")(
  function* (packageName: string) {
    const editId = yield* EditsService.insert(packageName);

    const validTracks = yield* TracksService.list(packageName, editId).pipe(
      Effect.andThen(tracks =>
        tracks.tracks.filter(
          track =>
            track.track === "internal" &&
            track.releases &&
            track.releases.length > 0 &&
            track.releases[0].status === "inProgress", // TODO: inProgress만 허용할지 논의 필요
        ),
      ),
    );

    if (validTracks.length === 0) {
      return yield* new NoValidTracksError();
    }

    return validTracks;
  },
);

export class NoValidTracksError extends Data.TaggedError(
  "NoValidTracksError",
) {}
