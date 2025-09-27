import {
  USER_ROLE,
  USER_ROLE_LABEL,
  USER_STATUS_LABEL,
  USER_DELETED_LABEL,
  type UserRoleCode,
  type UserStatusCode,
  type UserDeletedCode,
} from '../constants/user.constants';

export function roleIsShopOrAdmin(roleCode: UserRoleCode) {
  return roleCode === USER_ROLE.SHOP || roleCode === USER_ROLE.ADMIN;
}

export function toRoleLabel(code: UserRoleCode) {
  return USER_ROLE_LABEL[code];
}
export function toStatusLabel(code: UserStatusCode) {
  return USER_STATUS_LABEL[code];
}
export function toDeletedLabel(code: UserDeletedCode) {
  return USER_DELETED_LABEL[code];
}
