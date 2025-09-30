import { Data, Effect } from "effect";

import type { AppImageType } from "@/google/schema/image";

import { EditsService } from "@/google/service/edits.service";
import { ImageService } from "@/google/service/image.service";
import { ListingService } from "@/google/service/listing.service";

export const getAppInformationUseCase = Effect.fn("getAppInformationUseCase")(
  function* (packageName: string, language: string = "ko-KR") {
    const editId = yield* EditsService.insert(packageName);

    const { title, fullDescription, shortDescription } = yield* ListingService.get(packageName, editId, language);
    const icon = yield* ImageService.list(packageName, editId, language, "icon").pipe(
      Effect.flatMap(
        res => res.images.length > 0
          ? Effect.succeed(res.images[0])
          : Effect.fail(new ImageNotFoundError("icon")),
      ),
      Effect.andThen(image => image.url),
    );

    const phoneScreenShots = yield* ImageService.list(packageName, editId, language, "phoneScreenshots").pipe(
      Effect.andThen(res => res.images.map(image => image.url)),
    );

    return {
      title,
      fullDescription,
      shortDescription,
      icon,
      phoneScreenShots,
    };
  },
);

export class ImageNotFoundError extends Data.TaggedError("ImageNotFoundError")<{
  message: string;
  imageType: AppImageType;
}> {
  constructor(imageType: AppImageType, message: string = "Image not found") {
    super({ message, imageType });
  }
}
