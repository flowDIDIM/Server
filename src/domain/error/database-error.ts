import { Data } from "effect";
import { InternalServerError } from "@/domain/error/internal-server-error";

export class DatabaseError extends InternalServerError {}
