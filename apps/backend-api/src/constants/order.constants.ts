// Constants for order model and related logic
export const ORDER_STATUS = {
  PENDING: 'pending', // chờ xác nhận
  SHIPPING: 'shipping', // đang giao
  DELIVERED: 'delivered', // đã nhận
  CANCELLED: 'cancelled', // đã huỷ
  RETURNED: 'returned', // trả hàng hoàn tiền
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

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
