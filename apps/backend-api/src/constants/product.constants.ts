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
