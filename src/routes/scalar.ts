import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";

const scalarRoute = new Hono();

scalarRoute.get("/scalar", Scalar({ url: "/openapi" }));

export default scalarRoute;
