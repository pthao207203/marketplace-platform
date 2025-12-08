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
import customerRoute from "./customer.route";
import sellerRoute from "./seller.route";
import adminListRoute from "./admin.route";

import {
  requireAdminAuth,
  requireClientAuth,
  requireShopOrAdminAuth,
} from "../../middlewares/auth.middleware";
import {
  fakeAdminAuth,
  fakeShopOrAdminAuth,
} from "../../middlewares/dev-auth.middleware";

const routeAdmin = (app: Application) => {
  const PATH_ADMIN = systemConfig.prefixAdmin;

  // ⚠️ CHỌN MIDDLEWARE DỰA TRÊN ENVIRONMENT
  const isDevelopment =
    process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true";

  // Nếu development → dùng fake auth
  // Nếu production → dùng real auth
  const adminMiddlewares = isDevelopment ? [fakeAdminAuth] : [requireAdminAuth];

  const shopOrAdminMiddlewares = isDevelopment
    ? [fakeShopOrAdminAuth]
    : [requireShopOrAdminAuth];

  console.log(
    ` Auth Mode: ${
      isDevelopment ? "DEVELOPMENT (Fake Auth)" : "PRODUCTION (Real Auth)"
    }`
  );

  app.use(PATH_ADMIN + `/dashboard`, [], dashboardRoute);

  app.use(PATH_ADMIN + `/auth`, authRoute);

  app.use(PATH_ADMIN + `/products`, shopOrAdminMiddlewares, productRoute);

  app.use(PATH_ADMIN + `/orders`, shopOrAdminMiddlewares, orderRoute);

  app.use(PATH_ADMIN + `/users`, [], userAdminRoute);

  app.use(PATH_ADMIN + `/categories`, adminMiddlewares, categoryRoute);

  app.use(PATH_ADMIN + `/brands`, adminMiddlewares, brandRoute);

  app.use(PATH_ADMIN + `/system`, [], systemRoute);

  app.use(PATH_ADMIN + `/pay`, adminMiddlewares, payRoute);

  app.use(PATH_ADMIN + `/cloudinary`, adminMiddlewares, cloudinaryRoute);

  app.use(PATH_ADMIN + `/customers`, [], customerRoute);

  app.use(PATH_ADMIN + `/sellers`, [], sellerRoute);

  app.use(PATH_ADMIN + `/administrators`, [], adminListRoute);
};

export default routeAdmin;
