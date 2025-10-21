import { makeHttpError } from "@/domain/error/http-error";

export class BadRequestError extends makeHttpError(
  "BadRequestError",
  400,
  "Bad request",
) {}
