import { createApp } from "@/lib/create-app";
import appRoute from "@/routes/developer/app";
import paymentRoute from "@/routes/developer/payment";
import validateRoute from "@/routes/developer/validate";

const developerRoute = createApp()
  .route("/app", appRoute)
  .route("/payment", paymentRoute)
  .route("/validate", validateRoute);

export default developerRoute;
