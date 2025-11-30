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

const routeAdmin = (app: Application) => {
  const PATH_ADMIN = systemConfig.prefixAdmin;

  const adminMiddlewares = [requireAdminAuth];
  const shopOrAdminMiddlewares = [requireShopOrAdminAuth];

  app.use(PATH_ADMIN + `/dashboard`, [], dashboardRoute);

  app.use(PATH_ADMIN + `/auth`, authRoute);

  app.use(PATH_ADMIN + `/products`, shopOrAdminMiddlewares, productRoute);

  app.use(PATH_ADMIN + `/orders`, shopOrAdminMiddlewares, orderRoute);

  app.use(PATH_ADMIN + `/users`, adminMiddlewares, userAdminRoute);

  app.use(PATH_ADMIN + `/categories`, adminMiddlewares, categoryRoute);

  app.use(PATH_ADMIN + `/brands`, adminMiddlewares, brandRoute);

  app.use(PATH_ADMIN + `/system`, adminMiddlewares, systemRoute);

  app.use(PATH_ADMIN + `/pay`, adminMiddlewares, payRoute);

  app.use(PATH_ADMIN + `/cloudinary`, adminMiddlewares, cloudinaryRoute);
};

export default routeAdmin;
