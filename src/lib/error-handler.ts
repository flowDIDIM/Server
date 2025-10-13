import type { HTTPResponseError } from "hono/types";
import { Context } from "hono";
import type { AppEnv } from "@/app";
import { FiberFailureCauseId, isFiberFailure } from "effect/Runtime";
import { Cause } from "effect";
import { HttpError } from "@/domain/error/http-error";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { YieldableError } from "effect/Cause";
import { FiberId } from "effect/FiberId";

export function handleHonoError(
  error: Error | HTTPResponseError,
  c: Context<AppEnv>,
) {
  if (isFiberFailure(error) && Cause.isCause(error[FiberFailureCauseId])) {
    const cause = error[FiberFailureCauseId];

    const actualError = Cause.match(cause, {
      onFail: function (error: unknown): unknown {
        return error;
      },
      onDie: function (defect: unknown): unknown {
        return defect;
      },
      onEmpty: undefined,
      onInterrupt: function (fiberId: FiberId): unknown {
        throw new Error("Function not implemented.");
      },
      onSequential: function (left: unknown, right: unknown): unknown {
        throw new Error("Function not implemented.");
      },
      onParallel: function (left: unknown, right: unknown): unknown {
        throw new Error("Function not implemented.");
      },
    });

    if (actualError instanceof HttpError) {
      return c.json(
        { error: error.message, _tag: actualError._tag },
        actualError.status as ContentfulStatusCode,
      );
    }

    if (actualError instanceof YieldableError) {
      if ("_tag" in actualError) {
        return c.json(
          { error: actualError.message, _tag: actualError._tag },
          400,
        );
      }
      return c.json({ error: actualError.message }, 400);
    }
  }

  console.error("Unhandled error:", error);
  return c.json({ error: "Internal Server Error" }, 500);
}
