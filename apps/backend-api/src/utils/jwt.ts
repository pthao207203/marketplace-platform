import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export type JwtPayload = {
  sub: string;         // user id
  role: 'shop' | 'admin' | 'customer' | 'guest';
  status: 'active' | 'inactive' | 'banned';
  deleted: 'no' | 'yes';
};

export function signAccessToken(payload: JwtPayload) {
  const token = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES,
  });
  return {
    accessToken: token,
    tokenType: 'Bearer' as const,
    expiresIn: ENV.JWT_ACCESS_EXPIRES,
  };
}
