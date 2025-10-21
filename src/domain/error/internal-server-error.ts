import { makeHttpError } from "@/domain/error/http-error";

export class InternalServerError extends makeHttpError(
  "InternalServerError",
  500,
  "Internal server error occurred",
) {}
