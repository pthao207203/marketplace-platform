import type { Application } from 'express'       
import { systemConfig } from '../../config/system' 
import authRoute from './auth.routes'  

module.exports = (app:Application) => {
  app.use(
    `/api` + `/auth`,
    authRoute
  );
};
