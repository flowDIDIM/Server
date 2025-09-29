import { Effect } from "effect";

import { listTracks } from "@/google/api/tracks/list-tracks";

export class TracksService extends Effect.Service<TracksService>()("didim/TracksService", {
  accessors: true,
  effect: Effect.gen(function* () {
    return {
      list: listTracks,
    } as const;
  }),
}) {}
