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
  requireClientAuth,
  requireShopOrAdminAuth,
} from "../../middlewares/auth.middleware";

const routeAdmin = (app: Application) => {};

module.exports = (app: Application) => {
  const adminMiddlewares = [requireAdminAuth];
  const shopOrAdminMiddlewares = [requireShopOrAdminAuth];
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
    systemConfig.prefixAdmin + `/dashboard`,
    shopOrAdminMiddlewares,
    dashboardRoute
  );
  app.use(systemConfig.prefixAdmin + `/auth`, authRoute);
  app.use(
    systemConfig.prefixAdmin + `/products`,
    shopOrAdminMiddlewares,
    productRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/orders`,
    shopOrAdminMiddlewares,
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
  app.use(systemConfig.prefixAdmin + `/pay`, adminMiddlewares, payRoute);
  app.use(systemConfig.prefixAdmin + `/cloudinary`, cloudinaryRoute);
};

export default routeAdmin;
