// MockProvider: mock data shaped similar to TrackingMore
type Checkpoint = { time: string; description?: string; location?: string };

export class MockProvider {
  store: Map<string, any>;

  constructor() {
    this.store = new Map<string, any>();
  }

  async createTracking(courierCode: string, trackingNumber: string) {
    const key = `${courierCode}:${trackingNumber}`;
    if (!this.store.has(key)) {
      this.store.set(key, {
        trackingNumber,
        courierCode,
        status: 'pending',
        checkpoints: [{ time: new Date().toISOString(), description: 'Created (mock)', location: 'Seller' }],
        raw: { simulated: true }
      });
    }
    return { ok: true, providerId: key };
  }

  async getTracking(courierCode: string, trackingNumber: string) {
    const key = `${courierCode}:${trackingNumber}`;
    return this.store.get(key) || {
      trackingNumber,
      courierCode,
      status: 'notfound',
      checkpoints: [],
      raw: {}
    };
  }

  // route simulate sẽ gọi vào đây
  async simulateEvent(courierCode: string, trackingNumber: string, payload: { time?: string; description?: string; location?: string; status?: string }) {
    const key = `${courierCode}:${trackingNumber}`;
    const existing = this.store.get(key) || { trackingNumber, courierCode, status: 'pending', checkpoints: [], raw: {} };
    existing.checkpoints.push({ time: payload.time || new Date().toISOString(), description: payload.description, location: payload.location });
    existing.status = payload.status || existing.status;
    this.store.set(key, existing);
    return existing;
  }

  verifyWebhook(): boolean { return true; } // mock does not sign
}

export default MockProvider;
