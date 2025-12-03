import type { Application } from "express";
import { systemConfig } from "../../config/system";

import dashboardRoute from "./dashboard.route";
import authRoute from "./auth.route";
import productRoute from "./product.route";
import categoryRoute from "./category.route";
import brandRoute from "./brand.route";
import systemRoute from "./system.route";
import orderRoute from "./order.route";
import userAdminRoute from "./user.route";
import payRoute from "./pay.route";
import cloudinaryRoute from "./cloudinary.route";

import {
  requireAdminAuth,
  requireShopOrAdminAuth,
} from "../../middlewares/auth.middleware";

const routeAdmin = (app: Application) => {
  const adminMiddlewares = [requireAdminAuth];
  const shopOrAdminMiddlewares = [requireShopOrAdminAuth];

  const adminPrefix = systemConfig.prefixAdmin || "/admin";

  app.use(`/api${adminPrefix}/auth`, authRoute);

  app.use("/api/shops", shopOrAdminMiddlewares, orderRoute);

  app.use("/api/orders", shopOrAdminMiddlewares, orderRoute);

  app.use(
    `/api${adminPrefix}/dashboard`,
    shopOrAdminMiddlewares,
    dashboardRoute
  );
  app.use(`/api${adminPrefix}/products`, shopOrAdminMiddlewares, productRoute);

  app.use(`/api${adminPrefix}/categories`, adminMiddlewares, categoryRoute);
  app.use(`/api${adminPrefix}/brands`, adminMiddlewares, brandRoute);
  app.use(`/api${adminPrefix}/system`, adminMiddlewares, systemRoute);
  app.use(`/api${adminPrefix}/users`, adminMiddlewares, userAdminRoute);
  app.use(`/api${adminPrefix}/pay`, adminMiddlewares, payRoute);
  app.use(`/api${adminPrefix}/cloudinary`, cloudinaryRoute);
};

export default routeAdmin;

module.exports = routeAdmin;
