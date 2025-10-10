import { createApp } from "@/lib/create-app";

const healthRoute = createApp().get("/", c => {
  return c.json({
    status: "ok",
  });
});

export default healthRoute;
