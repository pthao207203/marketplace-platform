import axios, { AxiosInstance } from 'axios';

export class TrackingMoreProvider {
  client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.TRACKINGMORE_BASE || 'https://api.trackingmore.com/v4',
      headers: { 'Tracking-Api-Key': process.env.TRACKINGMORE_API_KEY || '' }
    });
  }

  async createTracking(courier: string, number: string) {
    const { data } = await this.client.post('/trackings', { tracking_number: number, courier_code: courier });
    return { ok: true, providerId: data?.data?.id, raw: data };
  }

  async getTracking(courier: string, number: string) {
    const { data } = await this.client.get(`/trackings/${encodeURIComponent(courier)}/${encodeURIComponent(number)}`);
    const d = data?.data || data;
    const checkpoints = (d?.origin_info?.trackinfo || []).map((c: any) => ({
      time: c.Date, description: c.StatusDescription || c.description, location: c.Details || c.location
    }));
    return { trackingNumber: d?.tracking_number || number, courierCode: courier, status: d?.status || 'unknown', checkpoints, raw: d };
  }

  verifyWebhook(/* headers, rawBody */): boolean { return true; } // update with signature verification if available
}

export default TrackingMoreProvider;
