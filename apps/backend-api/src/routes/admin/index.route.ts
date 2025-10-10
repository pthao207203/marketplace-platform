import type { Application } from 'express';
import authRoute from './auth.routes';
import dashboardRoute from './dashboard.route';
import orderRoute from './order.route';

module.exports = (app: Application) => {
  // /admin/auth/...
  app.use('/admin/auth', authRoute);

  // /admin/dashboard/...
  app.use('/admin/dashboard', dashboardRoute);

  // /admin/orders/...
  app.use('/admin/orders', orderRoute);
};
