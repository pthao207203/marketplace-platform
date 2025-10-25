import type { Application } from 'express'       
import { systemConfig } from '../../config/system' 
import dashboardRoute from './dashboard.route'  
import authRoute from './auth.route' 
import productRoute from './product.route' 
import categoryRoute from './category.route'
import brandRoute from './brand.route'
import systemRoute from './system.route'
import { requireClientAuth } from '../../middlewares/auth';

module.exports = (app:Application) => {
  const adminMiddlewares = [requireClientAuth];

  app.use(
    systemConfig.prefixAdmin + `/dashboard`,
    adminMiddlewares,
    dashboardRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/auth`,
    authRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/products`,
    adminMiddlewares,
    productRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/categories`,
    adminMiddlewares,
    categoryRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/brands`,
    adminMiddlewares,
    brandRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/system`,
    adminMiddlewares,
    systemRoute
  );
};
