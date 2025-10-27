import { SHIPMENT_STATUS, SHIPMENT_EVENT_CODE, statusNameToValue } from '../constants/order.constants';

// RANK uses numeric values matching SHIPMENT_STATUS
export const RANK = {
  CREATED: 0,
  PICKED_UP: statusNameToValue('PICKED_UP'),
  IN_TRANSIT: statusNameToValue('IN_TRANSIT'),
  OUT_FOR_DELIVERY: statusNameToValue('OUT_FOR_DELIVERY'),
  DELIVERED: statusNameToValue('DELIVERED'),
  FAILED_ATTEMPT: statusNameToValue('FAILED'),
  EXCEPTION: statusNameToValue('FAILED'),
  RETURNING: statusNameToValue('RETURN_INITIATED'),
  RETURNED: statusNameToValue('RETURNED'),
  UNKNOWN: statusNameToValue('UNKNOWN')
} as const;

export function mapStatusToUnified(status: string | number = ''): number {
  // If caller passed a numeric event code, try mapping event->status first
  if (typeof status === 'number') {
    // status may actually be an event code numeric
    const mapped = EVENT_TO_STATUS[status as number];
    if (mapped) return mapped;
    return statusNameToValue('UNKNOWN');
  }

  const sRaw = String(status).trim();
  const s = sRaw.toLowerCase();

  // If the string matches an event code name (e.g., "PICKED_UP"), map via EVENT_TO_STATUS
  const asEventCode = (SHIPMENT_EVENT_CODE as any)[sRaw] ?? (SHIPMENT_EVENT_CODE as any)[sRaw.toUpperCase()];
  if (asEventCode) {
    const mapped = EVENT_TO_STATUS[asEventCode];
    if (mapped) return mapped;
  }

  // Fallback: treat as status description as before
  if (s === 'pickup' || s.includes('picked')) return statusNameToValue('PICKED_UP');
  if (s === 'transit' || s.includes('transit')) return statusNameToValue('IN_TRANSIT');
  if (s.includes('out for delivery')) return statusNameToValue('OUT_FOR_DELIVERY');
  if (s === 'delivered' || s.includes('delivered')) return statusNameToValue('DELIVERED');
  if (s.includes('fail') || s === 'undelivered') return statusNameToValue('FAILED');
  if (s.includes('exception')) return statusNameToValue('FAILED');
  if (s.includes('returned')) return statusNameToValue('RETURNED');
  return statusNameToValue('UNKNOWN');
}

export function mapDescToEventCode(desc = ''): number {
  const t = desc.toLowerCase();
  if (t.includes('out for delivery')) return SHIPMENT_EVENT_CODE.OUT_FOR_DELIVERY as number;
  if (t.includes('picked') || t.includes('pickup')) return SHIPMENT_EVENT_CODE.PICKED_UP as number;
  if (t.includes('arrive')) return SHIPMENT_EVENT_CODE.ARRIVAL_FACILITY as number;
  if (t.includes('depart') || t.includes('leave')) return SHIPMENT_EVENT_CODE.DEPARTURE_FACILITY as number;
  if (t.includes('deliver') && t.includes('success')) return SHIPMENT_EVENT_CODE.DELIVERED as number;
  if (t.includes('undelivered') || t.includes('fail')) return SHIPMENT_EVENT_CODE.FAILED as number;
  return SHIPMENT_EVENT_CODE.OUT_FOR_DELIVERY as number;
}

// Map eventCode -> shipment status value according to business rules
export const EVENT_TO_STATUS: Record<number, number> = {
  [SHIPMENT_EVENT_CODE.PICKED_UP]: SHIPMENT_STATUS.PICKED_UP,
  [SHIPMENT_EVENT_CODE.ARRIVAL_FACILITY]: SHIPMENT_STATUS.IN_TRANSIT,
  [SHIPMENT_EVENT_CODE.DEPARTURE_FACILITY]: SHIPMENT_STATUS.IN_TRANSIT,
  [SHIPMENT_EVENT_CODE.OUT_FOR_DELIVERY]: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  [SHIPMENT_EVENT_CODE.DELIVERED]: SHIPMENT_STATUS.DELIVERED,
  [SHIPMENT_EVENT_CODE.FAILED]: SHIPMENT_STATUS.FAILED,
  [SHIPMENT_EVENT_CODE.RETURN_INITIATED]: SHIPMENT_STATUS.RETURN_INITIATED,
};

export function eventCodeToStatusValue(eventCode: string | number) {
  const code = typeof eventCode === 'number' ? eventCode : ((SHIPMENT_EVENT_CODE as any)[String(eventCode)] ?? null);
  if (!code) return SHIPMENT_STATUS.UNKNOWN;
  return EVENT_TO_STATUS[code] ?? SHIPMENT_STATUS.UNKNOWN;
}
