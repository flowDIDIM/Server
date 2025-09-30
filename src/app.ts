import { eq } from "drizzle-orm";
import { validator } from "hono-openapi";

import "@/lib/env";
import { z } from "zod";

import type { Session, User } from "@/lib/auth";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import { createApp } from "@/lib/create-app";
import healthRoute from "@/routes/health";
import { makeOpenApiRoute } from "@/routes/openapi";
import scalarRoute from "@/routes/scalar";

export interface AppType {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}

const app = createApp();
app.route("/", healthRoute);
app.route("/", scalarRoute);
app.route("/", makeOpenApiRoute(app));

app.on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw));

app.post("/edit", validator("json", z.object({
  packageName: z.string(),
})), async (c) => {
  const { packageName } = c.req.valid("json");
  const user = c.get("user");

  if (!user) {
    return c.body(null, 401);
  }

  const account = await db.query.accountTable.findFirst({
    where: table => eq(table.userId, user.id),
  });

  if (!account) {
    return c.body(null, 404);
  }

  const accessToken = account.accessToken;
  const res = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/edits`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  }).then(res => res.json());

  console.log(res);
  return c.json(res);
});

export default app;

const customerId = "C049pe3fk";
