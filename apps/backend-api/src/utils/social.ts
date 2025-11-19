//apps/backend-api/src/utils/social.ts
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export type SocialPayload = {
  provider: string; // e.g. 'google', 'facebook'
  uid: string; // provider-specific user id
  email: string;
  name?: string;
};

export function signSocialToken(payload: SocialPayload, ttlSec = 600) {
  return jwt.sign(payload, ENV.PRECHECK_SECRET, { expiresIn: ttlSec });
}

export function verifySocialToken(token: string): SocialPayload {
  return jwt.verify(token, ENV.PRECHECK_SECRET) as SocialPayload;
}
