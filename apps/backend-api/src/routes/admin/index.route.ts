import type { Application } from 'express';
import { systemConfig } from '../../config/system';

import dashboardRoute from './dashboard.route';
import authRoute from './auth.route';
import productRoute from './product.route';
import categoryRoute from './category.route';
import brandRoute from './brand.route';
import systemRoute from './system.route';
import orderRoute from './order.route';
import userAdminRoute from './user.route';
import payRoute from './pay.route'; 

import { 
  requireAdminAuth, 
  requireShopOrAdminAuth 
} from '../../middlewares/auth.middleware';

const routeAdmin = (app: Application) => {
  
  const adminMiddlewares = [requireAdminAuth];
  const shopOrAdminMiddlewares = [requireShopOrAdminAuth];

  app.use(systemConfig.prefixAdmin + `/dashboard`, shopOrAdminMiddlewares, dashboardRoute);
  app.use(systemConfig.prefixAdmin + `/auth`, authRoute);
  app.use(systemConfig.prefixAdmin + `/products`, shopOrAdminMiddlewares, productRoute);
  app.use(systemConfig.prefixAdmin + `/orders`, shopOrAdminMiddlewares, orderRoute);
  app.use(systemConfig.prefixAdmin + `/users`, adminMiddlewares, userAdminRoute);
  app.use(systemConfig.prefixAdmin + `/categories`, adminMiddlewares, categoryRoute);
  app.use(systemConfig.prefixAdmin + `/brands`, adminMiddlewares, brandRoute);
  app.use(systemConfig.prefixAdmin + `/system`, adminMiddlewares, systemRoute);
  app.use(systemConfig.prefixAdmin + `/pay`, adminMiddlewares, payRoute);
};

export default routeAdmin;
