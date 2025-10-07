import { HttpError } from "@/domain/error/http-error";

export class ConflictError extends HttpError {
  constructor(message: string = "Resource conflict", cause?: unknown) {
    super(409, message, cause);
  }
}
