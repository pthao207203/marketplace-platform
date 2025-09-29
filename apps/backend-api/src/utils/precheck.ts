import jwt from 'jsonwebtoken';
import { ENV } from "../config/env"

export type PrecheckPayload = {
  phone: string;        // E.164 hoặc định dạng bạn chuẩn hoá
  purpose: 'register';
};

export function signPrecheckToken(payload: PrecheckPayload, ttlSec = 600) {
  return jwt.sign(payload, ENV.PRECHECK_SECRET, { expiresIn: ttlSec }); // 10 phút
}

export function verifyPrecheckToken(token: string): PrecheckPayload {
  return jwt.verify(token, ENV.PRECHECK_SECRET) as PrecheckPayload;
}
