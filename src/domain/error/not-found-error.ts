import { makeHttpError } from "@/domain/error/http-error";

export class NotFoundError extends makeHttpError(
  "NotFoundError",
  404,
  "Resource not found",
) {}
