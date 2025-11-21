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
import {
  requireClientAuth,
  requireAdminAuth,
  requireShopOrAdminAuth,
} from "../../middlewares/auth";
import cloudinaryRoute from "./cloudinary.route";

module.exports = (app: Application) => {
  const adminMiddlewares = [requireAdminAuth];

  app.use(
    systemConfig.prefixAdmin + `/dashboard`,
    [requireShopOrAdminAuth],
    dashboardRoute
  );
  app.use(systemConfig.prefixAdmin + `/auth`, authRoute);
  app.use(
    systemConfig.prefixAdmin + `/products`,
    [requireShopOrAdminAuth],
    productRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/orders`,
    [requireShopOrAdminAuth],
    orderRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/users`,
    adminMiddlewares,
    userAdminRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/categories`,
    adminMiddlewares,
    categoryRoute
  );
  app.use(systemConfig.prefixAdmin + `/brands`, adminMiddlewares, brandRoute);
  app.use(systemConfig.prefixAdmin + `/system`, adminMiddlewares, systemRoute);
  app.use(systemConfig.prefixAdmin + `/cloudinary`, cloudinaryRoute);
};
