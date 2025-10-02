import { HttpError } from "@/domain/error/http-error";

export class InternalServerError extends HttpError {
  constructor(message: string = "Internal server error", cause?: unknown) {
    super(500, message, cause);
  }
}
