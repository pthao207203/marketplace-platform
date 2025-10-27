// Constants for order model and related logic
export const ORDER_STATUS = {
  PENDING: 0, // chờ xác nhận
  SHIPPING: 1, // đang giao
  DELIVERED: 2, // đã nhận
  CANCELLED: 3, // đã huỷ
  RETURNED: 4, // trả hàng hoàn tiền
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// reverse map: number -> name
export const ORDER_STATUS_NAME = Object.fromEntries(Object.entries(ORDER_STATUS).map(([k, v]) => [v as any, k]));

export function orderStatusNameToValue(name: string | number) {
  if (typeof name === 'number') return name;
  return (ORDER_STATUS as any)[String(name)] ?? ORDER_STATUS.PENDING;
}
export function orderStatusValueToName(val: number) {
  return (ORDER_STATUS_NAME as any)[val] ?? 'PENDING';
}

export const PAYMENT_METHOD = {
  WALLET: 'wallet',
  COD: 'cod',
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export default {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
};

// Shipment-related enums
export const SHIPMENT_STATUS = {
  UNKNOWN: 0,
  LABEL_CREATED: 1,
  PICKED_UP: 2,
  IN_TRANSIT: 3,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
  FAILED: 7,
  RETURN_INITIATED: 8,
  RETURNED: 9,
} as const;

// Mô tả trạng thái shipment bằng tiếng Việt (mapping giá trị số -> mô tả)
export const SHIPMENT_STATUS_NOTE_VI: Record<number, string> = {
  [SHIPMENT_STATUS.UNKNOWN]: 'Không rõ trạng thái',
  [SHIPMENT_STATUS.LABEL_CREATED]: 'Đã tạo vận đơn',
  [SHIPMENT_STATUS.PICKED_UP]: 'Đã lấy hàng',
  [SHIPMENT_STATUS.IN_TRANSIT]: 'Đang vận chuyển',
  [SHIPMENT_STATUS.OUT_FOR_DELIVERY]: 'Đang giao (shipper đang tới)',
  [SHIPMENT_STATUS.DELIVERED]: 'Đã giao thành công',
  [SHIPMENT_STATUS.FAILED]: 'Giao thất bại',
  [SHIPMENT_STATUS.RETURN_INITIATED]: 'Khởi tạo trả hàng',
  [SHIPMENT_STATUS.RETURNED]: 'Đã trả/hoàn hàng'
};

export function statusValueToNoteVi(val: number) {
  return SHIPMENT_STATUS_NOTE_VI[val] ?? null;
}

export const SHIPMENT_EVENT_CODE = {
  PICKED_UP: 1,
  ARRIVAL_FACILITY: 2,
  DEPARTURE_FACILITY: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  FAILED: 6,
  RETURN_INITIATED: 7,
} as const;

// Mô tả sự kiện bằng tiếng Việt (mapping giá trị số -> mô tả)
export const SHIPMENT_EVENT_NOTE_VI: Record<number, string> = {
  [SHIPMENT_EVENT_CODE.PICKED_UP]: 'Đơn vị vận chuyển lấy hàng thành công',
  [SHIPMENT_EVENT_CODE.ARRIVAL_FACILITY]: 'Đơn hàng đã đến bưu cục',
  [SHIPMENT_EVENT_CODE.DEPARTURE_FACILITY]: 'Đơn hàng đã rời bưu cục',
  [SHIPMENT_EVENT_CODE.OUT_FOR_DELIVERY]: 'Đơn hàng sẽ sớm được giao, vui lòng chú ý điện thoại',
  [SHIPMENT_EVENT_CODE.DELIVERED]: 'Giao hàng thành công',
  [SHIPMENT_EVENT_CODE.FAILED]: 'Giao thất bại, đơn hàng sẽ được gửi trả lại người gửi',
  [SHIPMENT_EVENT_CODE.RETURN_INITIATED]: 'Khởi tạo trả hàng'
};

export function eventCodeValueToNoteVi(val: number) {
  return SHIPMENT_EVENT_NOTE_VI[val] ?? null;
}

// helper maps: name <-> value
const buildReverse = <T extends Record<string, number | string>>(obj: T) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [v as any, k]));

export const SHIPMENT_STATUS_NAME = buildReverse(SHIPMENT_STATUS);
export const SHIPMENT_EVENT_CODE_NAME = buildReverse(SHIPMENT_EVENT_CODE);

export function statusNameToValue(name: string | number) {
  if (typeof name === 'number') return name;
  return (SHIPMENT_STATUS as any)[String(name)] ?? SHIPMENT_STATUS.UNKNOWN;
}
export function statusValueToName(val: number) {
  return (SHIPMENT_STATUS_NAME as any)[val] ?? 'UNKNOWN';
}

export function eventCodeNameToValue(name: string | number) {
  if (typeof name === 'number') return name;
  return (SHIPMENT_EVENT_CODE as any)[String(name)] ?? null;
}
export function eventCodeValueToName(val: number) {
  return (SHIPMENT_EVENT_CODE_NAME as any)[val] ?? null;
}

// Map eventCode -> shipment status value according to requested rules:
// - PICKED_UP -> PICKED_UP
// - ARRIVAL_FACILITY / DEPARTURE_FACILITY -> IN_TRANSIT
// - OUT_FOR_DELIVERY / DELIVERED / FAILED / RETURN_INITIATED -> corresponding status
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

export type ShipmentStatus = typeof SHIPMENT_STATUS[keyof typeof SHIPMENT_STATUS];
export type ShipmentEventCode = typeof SHIPMENT_EVENT_CODE[keyof typeof SHIPMENT_EVENT_CODE];

