import type { Application } from 'express'       
import { systemConfig } from '../../config/system' 
import dashboardRoute from './dashboard.route'  
import authRoute from './auth.route' 
import productRoute from './product.route' 
import categoryRoute from './category.route'
import brandRoute from './brand.route'

module.exports = (app:Application) => {
  app.use(
    systemConfig.prefixAdmin + `/dashboard`,
    dashboardRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/auth`,
    authRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/products`,
    productRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/categories`,
    categoryRoute
  );
  app.use(
    systemConfig.prefixAdmin + `/brands`,
    brandRoute
  );
};
