/** User / Seller (public) */
export interface UserPublic {
    id: string;
    displayName: string;
    rating?: number;
}
export type Condition = 'new' | 'like_new' | 'used_good' | 'used_fair';
/** Sản phẩm cơ bản hiển thị ở danh sách */
export interface Product {
    id: string;
    title: string;
    price: number;
    quantity: number;
    images: string[];
    condition: Condition;
    seller: UserPublic;
    createdAt: string;
}
/** API wrapper chuẩn */
export interface ApiSuccess<T> {
    ok: true;
    data: T;
}
export interface ApiError {
    ok: false;
    error: string;
}
