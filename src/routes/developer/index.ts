import { createApp } from "@/lib/create-app";
import appRoute from "@/routes/developer/app";

const developerRoute = createApp();

developerRoute.route("/app", appRoute);

export default developerRoute;
