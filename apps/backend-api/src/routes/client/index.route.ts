import type { Application } from 'express';
import authRoute from './auth.routes';

module.exports = (app: Application) => {
  // /client/auth/...
  app.use('/client/auth', authRoute);
};
