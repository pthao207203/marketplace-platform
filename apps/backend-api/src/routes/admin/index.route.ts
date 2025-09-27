import type { Application } from 'express'
import dashboardRoute from './dashboard.route'         
import { systemConfig } from '../../config/system' 

module.exports = (app:Application) => {
  app.use(
    systemConfig.prefixAdmin + `/dashboard`,
    dashboardRoute
  );
};
