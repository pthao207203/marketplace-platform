import { initializeApp, cert, getApps, type AppOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type ServiceAccountLike = {
  project_id: string;
  client_email: string;
  private_key: string;
  [k: string]: unknown;
};

/**
 * Ưu tiên đọc từ:
 * 1) FIREBASE_SERVICE_ACCOUNT_JSON  (nội dung JSON)
 * 2) FIREBASE_SERVICE_ACCOUNT_PATH  (đường dẫn tới file JSON)
 * 3) GOOGLE_APPLICATION_CREDENTIALS (đường dẫn chuẩn của Google SDK)
 */
function getServiceAccount(): ServiceAccountLike {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return JSON.parse(json) as ServiceAccountLike;
  }

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    throw new Error(
      'Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.'
    );
  }
  // Dùng require để đọc file JSON cục bộ (CommonJS-compatible)
  // Nếu project ESM strict, có thể thay bằng fs.readFileSync(path, 'utf8') rồi JSON.parse
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fromFile = require(path);
  return fromFile as ServiceAccountLike;
}

function createOptions(): AppOptions {
  const svc = getServiceAccount();

  // Lưu ý: private_key trong .env cần giữ \n đúng:
  // Nếu đang escape, thay \\n -> \n:
  if (typeof svc.private_key === 'string') {
    (svc as any).private_key = svc.private_key.replace(/\\n/g, '\n');
  }

  return {
    credential: cert(svc as any),
    projectId: svc.project_id,
  };
}
function initApp() {
  // Nếu có emulator → không cần private key
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'glb-model-ie402';
    return initializeApp({ projectId });
  }

  // Production / staging: dùng service account như bạn đã cấu hình
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in non-emulator mode');
  const svc = JSON.parse(json);
  svc.private_key = svc.private_key?.replace(/\\n/g, '\n');
  return initializeApp({ credential: cert(svc), projectId: svc.project_id });
}

// Khởi tạo 1 lần duy nhất
const app = getApps()[0] ?? initApp();

export const adminAuth = getAuth(app);
export default app;
