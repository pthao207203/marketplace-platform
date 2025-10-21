import type { Application } from 'express'       
import { systemConfig } from '../../config/system' 
import authRoute from './auth.route' 
import productRoute from './product.route' 
import userRoute from './user.route'

module.exports = (app:Application) => {
  app.use(
    `/api` + `/auth`,
    authRoute
  );
  app.use(
    `/api` + `/products`,
    productRoute
  );
  app.use(
    `/api` + `/me`,
    userRoute
  );
};
