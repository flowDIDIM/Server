import { createApp } from "@/lib/create-app";
import appRoute from "@/routes/developer/app";
import paymentRoute from "@/routes/developer/payment";

const developerRoute = createApp();

developerRoute.route("/app", appRoute);
developerRoute.route("/payment", paymentRoute);

export default developerRoute;
