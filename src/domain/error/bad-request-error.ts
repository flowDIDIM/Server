import { HttpError } from "@/domain/error/http-error";

export class BadRequestError extends HttpError {
  constructor(message: string = "Bad request", cause?: unknown) {
    super(400, message, cause);
  }
}
