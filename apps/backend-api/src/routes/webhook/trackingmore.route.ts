import { Router, Request, Response } from 'express';
import ShipmentModel from '../../models/shipment.model';
import axios from 'axios';
import { upsertFromProvider } from '../../utils/shipment-service';
import { eventCodeNameToValue } from '../../constants/order.constants';
import { mapDescToEventCode, mapStatusToUnified } from '../../utils/mapper';
const router = Router();

// POST /trackingmore - webhook receiver from tracking service
router.post('/', async (req: Request, res: Response) => {
  try {
    const trackingNumber = req.body?.data?.tracking_number || req.body?.tracking_number;
    const courierCode = req.body?.data?.courier_code || req.body?.courier_code;
    const event = req.body?.event || req.body?.tracking_event || null;

    if (!trackingNumber || !courierCode) return res.status(200).json({ ok: true });

    const s = await ShipmentModel.findOne({ trackingNumber, courierCode });
    if (!s) return res.status(200).json({ ok: true });

    if (event) {
      s.events = s.events || [];
      const desc = event.description || event.note || '';
      const code = event.status ? eventCodeNameToValue(event.status) : mapDescToEventCode(desc);

      s.events.push({
        eventTime: new Date(),
        description: desc,
        location: event.location || '',
        eventCode: code,
        raw: event
      });

      s.lastSyncedAt = new Date();
      if (event.status) {
        s.rawStatus = event.status;
        // update numeric currentStatus using mapper
        try {
          s.currentStatus = mapStatusToUnified(event.status);
        } catch (e) {
          // ignore mapping errors
        }
      }

      await s.save();
      try {
        const trackingDataForUpsert = { status: event.status, checkpoints: [event], tracking_number: trackingNumber, courier_code: courierCode };
        // console.info('trackingmore webhook: calling upsertFromProvider for shipment', String(s._id));
        await upsertFromProvider(String(s._id), trackingDataForUpsert);
      } catch (e: any) {
        console.error('upsertFromProvider failed in webhook path', e?.message || e);
      }
      return res.json({ ok: true });
    }

    // fallback: fetch full tracking state from tracking service and upsert
    const trackingServiceUrl = process.env.TRACKING_SERVICE_URL;
    if (!trackingServiceUrl) return res.json({ ok: true });

    const resp = await axios.get(
      `${trackingServiceUrl.replace(/\/$/, '')}/tracking/${encodeURIComponent(courierCode)}/${encodeURIComponent(trackingNumber)}`
    );
    const trackingData = resp.data || null;
    if (trackingData) {
      await upsertFromProvider(String(s._id), trackingData);
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('trackingmore webhook error', err?.message || err);
    return res.status(500).json({ ok: false, error: err?.message || err });
  }
});

export default router;
