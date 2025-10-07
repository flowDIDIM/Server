import { HttpError } from "@/domain/error/http-error";

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized", cause?: unknown) {
    super(403, message, cause);
  }
}
