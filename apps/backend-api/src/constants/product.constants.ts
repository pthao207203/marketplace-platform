export const PRODUCT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  DRAFT: 3,
  ARCHIVED: 4,
} as const;
export type ProductStatusCode = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];

export const PRODUCT_DELETED = {
  NO: 0,
  YES: 1,
} as const;
export type ProductDeletedCode = typeof PRODUCT_DELETED[keyof typeof PRODUCT_DELETED];

export const PRODUCT_STATUS_LABEL: Record<ProductStatusCode, 'active' | 'inactive' | 'draft' | 'archived'> = {
  [PRODUCT_STATUS.ACTIVE]: 'active',
  [PRODUCT_STATUS.INACTIVE]: 'inactive',
  [PRODUCT_STATUS.DRAFT]: 'draft',
  [PRODUCT_STATUS.ARCHIVED]: 'archived',
};

export const PRODUCT_DELETED_LABEL: Record<ProductDeletedCode, 'no' | 'yes'> = {
  [PRODUCT_DELETED.NO]: 'no',
  [PRODUCT_DELETED.YES]: 'yes',
};

export const PRODUCT_STATUS_CODE: Record<'active' | 'inactive' | 'draft' | 'archived', ProductStatusCode> = {
  active: PRODUCT_STATUS.ACTIVE,
  inactive: PRODUCT_STATUS.INACTIVE,
  draft: PRODUCT_STATUS.DRAFT,
  archived: PRODUCT_STATUS.ARCHIVED,
};

export const PRODUCT_DELETED_CODE: Record<'no' | 'yes', ProductDeletedCode> = {
  no: PRODUCT_DELETED.NO,
  yes: PRODUCT_DELETED.YES,
};

export const PRODUCT_PRICE_TYPE = {
  FIXED: 1,
  NEGOTIABLE: 2,
  AUCTION: 3,
} as const;
export type ProductPriceType = typeof PRODUCT_PRICE_TYPE[keyof typeof PRODUCT_PRICE_TYPE];

export const PRODUCT_PRICE_TYPE_VALUES = [PRODUCT_PRICE_TYPE.FIXED, PRODUCT_PRICE_TYPE.NEGOTIABLE, PRODUCT_PRICE_TYPE.AUCTION] as const;

// Negotiation status enum (stored as Number)
export const NEGOTIATION_STATUS = {
  PENDING: 1,
  ACCEPTED: 2,
  REJECTED: 3,
  CANCELLED: 4,
} as const;
export type NegotiationStatusCode = typeof NEGOTIATION_STATUS[keyof typeof NEGOTIATION_STATUS];

export const NEGOTIATION_STATUS_VALUES = [NEGOTIATION_STATUS.PENDING, NEGOTIATION_STATUS.ACCEPTED, NEGOTIATION_STATUS.REJECTED, NEGOTIATION_STATUS.CANCELLED] as const;
