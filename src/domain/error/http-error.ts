import { Data } from "effect";

export class HttpError extends Data.TaggedError("HttpError") {
  constructor(public readonly status: number, public readonly message: string, public readonly cause?: unknown) {
    super();
  }
}
