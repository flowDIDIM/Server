import { Effect } from "effect";
import { isUnknownException } from "effect/Cause";

import { HttpError } from "@/domain/error/http-error";
import { InternalServerError } from "@/domain/error/internal-server-error";

export const mapHttpError
  = Effect.mapError((error) => {
    if (isUnknownException(error) && error.error instanceof HttpError) {
      return error.error;
    }

    return new InternalServerError("An unexpected error occurred", error);
  });
