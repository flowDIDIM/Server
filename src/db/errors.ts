import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message: string;
  cause?: unknown;
}> {
  constructor(message: string, cause?: unknown) {
    super({ message, cause });
  }
}
