import type { HTTPResponseError } from "hono/types";
import { Context } from "hono";
import type { AppEnv } from "@/app";
import { FiberFailureCauseId, isFiberFailure } from "effect/Runtime";
import { Cause } from "effect";
import { HttpError } from "@/domain/error/http-error";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function handleHonoError(
  error: Error | HTTPResponseError,
  c: Context<AppEnv>,
) {
  if (
    isFiberFailure(error) &&
    Cause.isCause(error[FiberFailureCauseId]) &&
    Cause.isDieType(error[FiberFailureCauseId])
  ) {
    const actualError = error[FiberFailureCauseId].defect;
    if (actualError instanceof HttpError) {
      return c.json(
        { error: error.message },
        actualError.status as ContentfulStatusCode,
      );
    }

    return c.json({ error: "Internal Server Error" }, 500);
  }

  return c.json({ error: "Internal Server Error" }, 500);
}
