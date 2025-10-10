import { createApp } from "@/lib/create-app";

const validateRoute = createApp();

validateRoute.get("/package/:packageName", async c => {
  const { packageName } = c.req.param();
});

export default validateRoute;
