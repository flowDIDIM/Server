import { HttpError } from "@/domain/error/http-error";

export class NotFoundError extends HttpError {
  constructor(message: string = "Resource not found") {
    super(404, message);
  }
}
