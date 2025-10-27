import crypto from 'crypto';
import ShipmentModel from '../models/shipment.model';
import { mapStatusToUnified, mapDescToEventCode, RANK } from './mapper';
import { statusValueToName } from '../constants/order.constants';

export async function upsertFromProvider(shipmentId: string, tmLike: any) {
  const status = mapStatusToUnified(tmLike.status);
  const sh: any = await ShipmentModel.findById(shipmentId as any);

  // If provider supplied tracking/courier and shipment doesn't have them, persist them
  const updates: any = {};
  if (tmLike.tracking_number && (!sh || !sh.trackingNumber)) updates.trackingNumber = tmLike.tracking_number;
  if (tmLike.courier_code && (!sh || !sh.courierCode)) updates.courierCode = tmLike.courier_code;

  // Determine promotion using RANK lookup by status name (RANK keys are names)
  const statusName = statusValueToName(status);
  const currentStatusName = sh && typeof sh.currentStatus === 'number' ? statusValueToName(sh.currentStatus) : 'CREATED';
  const shouldPromote = !sh || ((RANK as any)[statusName] ?? 0) > ((RANK as any)[currentStatusName] ?? 0);

  if (shouldPromote) {
    updates.currentStatus = status;
    updates.rawStatus = tmLike.status;
    updates.lastSyncedAt = new Date();
    await ShipmentModel.updateOne({ _id: shipmentId }, { $set: updates });
  } else if (Object.keys(updates).length) {
    // Only tracking/courier to set
    updates.lastSyncedAt = new Date();
    await ShipmentModel.updateOne({ _id: shipmentId }, { $set: updates });
  } else {
    await ShipmentModel.updateOne({ _id: shipmentId }, { $set: { lastSyncedAt: new Date() } });
  }

  // Process checkpoints/events
  for (const c of (tmLike.checkpoints || [])) {
    const time = c.time ? new Date(c.time) : new Date();
    const desc = c.description || c.desc || '';

    // Normalize location into the shape used by Shipment model
    let locObj: any = null;
    if (c.location) {
      if (typeof c.location === 'object') {
        locObj = {
          address: c.location.address || c.location.name || '',
          city: c.location.city || c.location.town || '',
          province: c.location.province || c.location.state || '',
          country: c.location.country || '',
          postalCode: c.location.postalCode || c.location.postal_code || '',
          lat: c.location.lat ?? c.location.latitude ?? null,
          lng: c.location.lng ?? c.location.longitude ?? null,
        };
      } else if (typeof c.location === 'string') {
        // Try to parse "lat,lng|address" or simple "lat,lng" or fallback to address string
        const parts = c.location.split('|').map((p: string) => p.trim());
        const coords = parts[0].split(',').map((p: string) => p.trim());
        if (coords.length === 2 && !isNaN(Number(coords[0])) && !isNaN(Number(coords[1]))) {
          locObj = { lat: Number(coords[0]), lng: Number(coords[1]), address: parts[1] ?? '' };
        } else {
          locObj = { address: c.location };
        }
      }
    }

    const code = mapDescToEventCode(desc);
    const hashInput = JSON.stringify({ shipmentId, time: time.toISOString(), desc, loc: locObj ?? c.location });
    const hash = crypto.createHash('sha1').update(hashInput).digest('hex');

    // Use embedded events array on the shipment document to keep model simple
    const shDoc: any = await ShipmentModel.findById(shipmentId as any).select('events').lean();
    const already = (shDoc?.events || []).find((e: any) => e.hash === hash);
    if (!already) {
      await ShipmentModel.updateOne({ _id: shipmentId }, { $push: { events: { shipmentId, eventCode: code, description: desc, location: locObj, eventTime: time, raw: c, hash } } });
    }
  }
}

export default { upsertFromProvider };
