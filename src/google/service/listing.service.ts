import { Effect } from "effect";

import { getListing } from "@/google/api/listing/get-listing";

export class ListingService extends Effect.Service<ListingService>()(
  "didim/ListingService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      return {
        get: getListing,
      } as const;
    }),
  },
) {}
