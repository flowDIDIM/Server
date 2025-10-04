import { HttpError } from "@/domain/error/http-error";

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized") {
    super(403, message);
  }
}