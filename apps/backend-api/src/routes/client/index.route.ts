import type { Application } from "express";
import authRoute from "./auth.route";
import productRoute from "./product.route";
import userRoute from "./user.route";
import orderRoute from "./order.route";
import paymentRoutes from "./payment.route";
import messageRoute from "./message.route";

const routeClient = (app: Application) => {
  app.use(`/api` + `/auth`, authRoute);
  app.use(`/api` + `/products`, productRoute);
  app.use(`/api` + `/me`, userRoute);
  app.use(`/api` + `/orders`, orderRoute);
  app.use("/api/client/payment", paymentRoutes);
  app.use(`/api` + `/message`, messageRoute);
};

export default routeClient;
