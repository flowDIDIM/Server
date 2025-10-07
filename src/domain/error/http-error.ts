import type { StatusCode } from "hono/utils/http-status";

import { Data } from "effect";

export class HttpError extends Data.TaggedError("HttpError") {
  constructor(
    public readonly status: StatusCode,
    public readonly message: string,
    public readonly cause?: unknown,
  ) {
    super();
  }
}
