import { makeHttpError } from "@/domain/error/http-error";

export class ConflictError extends makeHttpError(
  "ConflictError",
  409,
  "Resource conflict",
) {}
