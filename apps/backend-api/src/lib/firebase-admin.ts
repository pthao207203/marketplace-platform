import { initializeApp, cert, getApps, type AppOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Đối với môi trường Node.js/CommonJS, cần khai báo 'require' nếu nó không phải biến toàn cục
declare const require: (id: string) => any; 

type ServiceAccountLike = {
  project_id: string;
  client_email: string;
  private_key: string;
  [k: string]: unknown;
};

/**
 * Ưu tiên đọc từ:
 * 1) FIREBASE_SERVICE_ACCOUNT_JSON  (nội dung JSON)
 * 2) FIREBASE_SERVICE_ACCOUNT_PATH  (đường dẫn tới file JSON)
 * 3) GOOGLE_APPLICATION_CREDENTIALS (đường dẫn chuẩn của Google SDK)
 * * Lưu ý: Hàm này hiện không được gọi trong logic khởi tạo (xem initApp), 
 * nhưng mình giữ lại theo code gốc của bạn.
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fromFile = require(path); 
  return fromFile as ServiceAccountLike;
}

/**
 * Lưu ý: Hàm này hiện không được gọi trong logic khởi tạo (xem initApp), 
 * nhưng mình giữ lại theo code gốc của bạn.
 */
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

const DEFAULT_PROJECT_ID = 'glb-model-ie402';

function initApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;

  // 1. Chế độ Emulator: không cần private key
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log(`[Firebase Admin] Initializing for Emulator mode (Project: ${projectId}).`);
    return initializeApp({ projectId });
  }

  // 2. **TẠM THỜI BỎ QUA XÁC MINH** (Sửa đổi theo yêu cầu)
  // Đặt biến môi trường FIREBASE_ADMIN_SKIP_AUTH=true để kích hoạt chế độ này
  if (process.env.FIREBASE_ADMIN_SKIP_AUTH === 'true') {
    console.warn(
      `[Firebase Admin] WARNING: Initializing without Service Account Credentials (Bypass enabled via FIREBASE_ADMIN_SKIP_AUTH). 
      This is intended for local development only and relies on Application Default Credentials (ADC) if available, 
      or limited functionality.`
    );
    // Khởi tạo chỉ với project ID. Admin SDK sẽ cố gắng sử dụng ADC.
    return initializeApp({ projectId });
  }

  // 3. Môi trường Production / Staging: BẮT BUỘC phải có service account JSON
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_JSON. Credentials are required in non-emulator/non-bypass mode. Set FIREBASE_ADMIN_SKIP_AUTH=true to temporarily bypass.'
    );
  }

  console.log(`[Firebase Admin] Initializing with Service Account Credentials (Project: ${projectId}).`);
  
  try {
    const svc = JSON.parse(json);
    // Xử lý ký tự xuống dòng bị escape
    svc.private_key = svc.private_key?.replace(/\\n/g, '\n');
    return initializeApp({ credential: cert(svc), projectId: svc.project_id });
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    throw new Error('Invalid JSON format for FIREBASE_SERVICE_ACCOUNT_JSON.');
  }
}

// Khởi tạo 1 lần duy nhất
const app = getApps()[0] ?? initApp();

export const adminAuth = getAuth(app);
export default app;
