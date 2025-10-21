import type { StatusCode } from "hono/utils/http-status";
import type * as Cause from "effect/Cause";
import { Error } from "effect/Data";

const HTTP_ERROR_SYMBOL = Symbol("HttpError");

export interface HttpError {
  readonly _tag: string;
  readonly status: StatusCode;
  readonly message: string;
  readonly cause?: unknown;
}

export const makeHttpError = <Tag extends string>(
  tag: Tag,
  status: StatusCode,
  defaultMessage: string,
): new (
  message?: string,
  cause?: unknown,
) => Cause.YieldableError & {
  readonly _tag: Tag;
  readonly message: string;
  readonly status: StatusCode;
} => {
  const O = {
    BaseEffectError: class extends Error<{}> implements HttpError {
      readonly _tag = tag;
      readonly status = status;
      readonly message: string;
      readonly [HTTP_ERROR_SYMBOL] = true; // 마커 추가

      constructor(
        message?: string,
        readonly cause?: unknown,
      ) {
        super();
        this.message = message || defaultMessage;
      }
    },
  };
  (O.BaseEffectError.prototype as any).name = tag;
  return O.BaseEffectError as any;
};

export function isHttpError(error: unknown): error is HttpError {
  return (
    typeof error === "object" && error !== null && HTTP_ERROR_SYMBOL in error
  );
}
