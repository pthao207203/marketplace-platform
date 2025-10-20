import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';

let app;
if (!getApps().length) {
  // Ưu tiên service account path nếu có
  const saPath = process.env.FB_ADMIN_SA_PATH; // ví dụ ./service-accounts/nt118-group8.json
  if (saPath && fs.existsSync(saPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    console.log('[DBG] admin.project_id=', serviceAccount.project_id);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    console.log('[DBG] admin.project_id=(ADC or unknown)');
    app = initializeApp({ credential: applicationDefault() });
  }
}
export const adminAuth = getAuth();
