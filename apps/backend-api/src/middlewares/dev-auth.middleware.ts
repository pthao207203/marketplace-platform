// apps/backend-api/src/middlewares/dev-auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { USER_ROLE } from "../constants/user.constants";

/**
 * Fake authentication middleware for development
 * Tạo một fake user với role ADMIN
 * ⚠️ KHÔNG BAO GIỜ DÙNG TRONG PRODUCTION!
 */
export function fakeAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Tạo fake user payload giống như JWT payload
  const fakeUser = {
    sub: "68d764761df92cb0d9f7e571", // ID của superadmin trong DB
    role: "admin",
    userRole: USER_ROLE.ADMIN,
    status: "active",
    deleted: "no",
  };

  // Attach vào request
  (req as any).user = fakeUser;
  res.locals.user = fakeUser;

  console.log("🔓 [DEV MODE] Fake auth - User:", fakeUser.sub);
  
  return next();
}

/**
 * Fake shop/admin auth
 */
export function fakeShopOrAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const fakeUser = {
    sub: "68d764761df92cb0d9f7e571",
    role: "admin",
    userRole: USER_ROLE.ADMIN,
    status: "active",
    deleted: "no",
  };

  (req as any).user = fakeUser;
  res.locals.user = fakeUser;

  console.log("🔓 [DEV MODE] Fake shop/admin auth - User:", fakeUser.sub);
  
  return next();
}
