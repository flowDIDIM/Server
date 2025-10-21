import { Effect } from "effect";
import { isUnknownException, YieldableError } from "effect/Cause";

import { InternalServerError } from "@/domain/error/internal-server-error";
import { isHttpError } from "@/domain/error/http-error";

export const mapHttpError = Effect.mapError(error => {
  if (isUnknownException(error) && isHttpError(error.error)) {
    return error.error;
  }

  if (isHttpError(error)) {
    return error;
  }

  if (error instanceof YieldableError) {
    return new InternalServerError(error.message, {
      cause: error,
    });
  }

  return new InternalServerError("An unexpected error occurred", {
    cause: error,
  });
});
