import { Effect } from "effect";
import { isUnknownException, YieldableError } from "effect/Cause";

import { HttpError } from "@/domain/error/http-error";
import { InternalServerError } from "@/domain/error/internal-server-error";

export const mapHttpError = Effect.mapError(error => {
  if (isUnknownException(error) && error.error instanceof HttpError) {
    return error.error;
  }

  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof YieldableError) {
    return new InternalServerError(error.message);
  }

  console.error("Unexpected error:", error);
  return new InternalServerError("An unexpected error occurred", {
    cause: error,
  });
});
