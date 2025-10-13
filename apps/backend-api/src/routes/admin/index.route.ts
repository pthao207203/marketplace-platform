import type { Application } from 'express';
import { systemConfig } from '../../config/system';
import dashboardRoute from './dashboard.route';
import authRoute from './auth.routes';
import orderRoute from './order.route'; 

module.exports = (app: Application) => {
  app.use(
    systemConfig.prefixAdmin + `/dashboard`,
    dashboardRoute
  );

  app.use(
    systemConfig.prefixAdmin + `/auth`,
    authRoute
  );

  app.use(
    systemConfig.prefixAdmin + `/orders`, 
    orderRoute
  );
};
