import type { JwtPayload } from '../../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      // user do middleware auth gắn vào
      user?: JwtPayload & { token: string };
    }
  }
}

export {};
