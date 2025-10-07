import { Effect } from "effect";

import { listImages } from "@/google/api/images/list-images";

export class ImageService extends Effect.Service<ImageService>()(
  "didim/ImageService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      return {
        list: listImages,
      } as const;
    }),
  },
) {}
