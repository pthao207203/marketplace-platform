export const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  BANNED: 3,
} as const;
export type UserStatusCode = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const USER_ROLE = {
  GUEST: 1,
  CUSTOMER: 2,
  SHOP: 3,
  ADMIN: 4,
} as const;
export type UserRoleCode = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_DELETED = {
  NO: 0,
  YES: 1,
} as const;
export type UserDeletedCode = (typeof USER_DELETED)[keyof typeof USER_DELETED];

// ===== Labels (string) <-> Codes (number)
export const USER_STATUS_LABEL: Record<
  UserStatusCode,
  "active" | "inactive" | "banned"
> = {
  [USER_STATUS.ACTIVE]: "active",
  [USER_STATUS.INACTIVE]: "inactive",
  [USER_STATUS.BANNED]: "banned",
};

export const USER_ROLE_LABEL: Record<
  UserRoleCode,
  "guest" | "customer" | "shop" | "admin"
> = {
  [USER_ROLE.GUEST]: "guest",
  [USER_ROLE.CUSTOMER]: "customer",
  [USER_ROLE.SHOP]: "shop",
  [USER_ROLE.ADMIN]: "admin",
};

export const USER_DELETED_LABEL: Record<UserDeletedCode, "no" | "yes"> = {
  [USER_DELETED.NO]: "no",
  [USER_DELETED.YES]: "yes",
};

// Reverse maps (string -> number) nếu cần
export const USER_STATUS_CODE: Record<
  "active" | "inactive" | "banned",
  UserStatusCode
> = {
  active: USER_STATUS.ACTIVE,
  inactive: USER_STATUS.INACTIVE,
  banned: USER_STATUS.BANNED,
};

export const USER_ROLE_CODE: Record<
  "guest" | "customer" | "shop" | "admin",
  UserRoleCode
> = {
  guest: USER_ROLE.GUEST,
  customer: USER_ROLE.CUSTOMER,
  shop: USER_ROLE.SHOP,
  admin: USER_ROLE.ADMIN,
};

export const USER_DELETED_CODE: Record<"no" | "yes", UserDeletedCode> = {
  no: USER_DELETED.NO,
  yes: USER_DELETED.YES,
};
