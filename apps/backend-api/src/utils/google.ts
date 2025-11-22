import https from 'node:https';
import { ENV } from '../config/env';

export type GoogleIdTokenPayload = {
  iss: string;
  azp?: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat?: string;
  exp?: string;
};

export function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
  return new Promise((resolve, reject) => {
    if (!idToken) return reject(new Error('Missing idToken'));
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => (data += chunk));
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(data) as GoogleIdTokenPayload;
          // if Google returns error, it may be 400 with JSON like { error_description }
          if ((parsed as any).error_description) return reject(new Error((parsed as any).error_description));

          // validate audience if configured
          const allowed = (ENV.GOOGLE_CLIENT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
          if (allowed.length > 0 && !allowed.includes(parsed.aud)) {
            return reject(new Error('Token audience (aud) not in allowed GOOGLE_CLIENT_IDS'));
          }

          return resolve(parsed);
        } catch (e) {
          return reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
}
