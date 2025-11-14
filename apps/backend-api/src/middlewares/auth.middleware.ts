import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { USER_ROLE, USER_ROLE_CODE } from "../constants/user.constants";

function resolveRoleCode(role: any): number {
  if (typeof role === "number") return Number(role);
  if (typeof role === "string") {
    // numeric string -> number
    const n = Number(role);
    if (!Number.isNaN(n)) return n;
    // label string -> map via USER_ROLE_CODE (expects lowercase keys)
    const key = String(role).toLowerCase();
    // @ts-ignore access by dynamic key
    const mapped = USER_ROLE_CODE[key];
    return typeof mapped === "number" ? mapped : NaN;
  }
  return NaN;
}

export function requireClientAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth =
      req.headers.authorization ||
      (req.body && req.body.token) ||
      req.query.token;
    if (!auth)
      return res
        .status(401)
        .json({ success: false, error: { message: "Missing token" } });
    const token = String(auth).startsWith("Bearer ")
      ? String(auth).slice(7)
      : String(auth);
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as any;
    
    // attach to req.user
    req.user = { ...payload, token };

    res.locals.user = req.user; 

    return next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid token", details: err?.message },
    });
  }
}

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth =
      req.headers.authorization ||
      (req.body && req.body.token) ||
      req.query.token;
    if (!auth)
      return res
        .status(401)
        .json({ success: false, error: { message: "Missing token" } });
    const token = String(auth).startsWith("Bearer ")
      ? String(auth).slice(7)
      : String(auth);
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as any;
    
    // role check - ADMIN only
    if (!payload || typeof payload.role === "undefined") {
      return res.status(403).json({
        success: false,
        error: { message: "Admin privileges required" },
      });
    }
    const roleCode = resolveRoleCode(payload.role);
    if (Number.isNaN(roleCode) || roleCode !== USER_ROLE.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { message: "Admin privileges required" },
      });
    }
    req.user = { ...payload, token };
    return next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid token", details: err?.message },
    });
  }
}

export function requireShopOrAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth =
      req.headers.authorization ||
      (req.body && req.body.token) ||
      req.query.token;
    if (!auth)
      return res
        .status(401)
        .json({ success: false, error: { message: "Missing token" } });
    const token = String(auth).startsWith("Bearer ")
      ? String(auth).slice(7)
      : String(auth);
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as any;
    
    // allow SHOP or ADMIN
    if (!payload) {
      return res.status(403).json({
        success: false,
        error: { message: "Insufficient privileges" },
      });
    }
    const rawRole =
      typeof payload.userRole !== "undefined" ? payload.userRole : payload.role;
    if (typeof rawRole === "undefined") {
      return res.status(403).json({
        success: false,
        error: { message: "Insufficient privileges" },
      });
    }
    const roleCode2 = resolveRoleCode(rawRole);
    if (
      Number.isNaN(roleCode2) ||
      (roleCode2 !== USER_ROLE.SHOP && roleCode2 !== USER_ROLE.ADMIN)
    ) {
      return res.status(403).json({
        success: false,
        error: { message: "SHOP or ADMIN privileges required" },
      });
    }
    req.user = { ...payload, token };
    return next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid token", details: err?.message },
    });
  }
}
