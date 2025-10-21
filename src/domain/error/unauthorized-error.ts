import { makeHttpError } from "@/domain/error/http-error";

export class UnauthorizedError extends makeHttpError(
  "UnauthorizedError",
  403,
  "Unauthorized",
) {}
