import { makeHttpError } from "@/domain/error/http-error";

export class DatabaseError extends makeHttpError(
  "DatabaseError",
  500,
  "Database error occurred",
) {}
