// share-types/src/index.ts
export type VND = number;

export interface AuctionItem {
  id: string;
  title: string;
  imageUrl: string;
  quantity: number;
  currentPrice: VND;
  currency: "VND";
  endsAt: string;          // ISO
  condition?: string;
  featured?: boolean;      // flag chọn làm "Đấu giá nổi bật"
}

export interface Category {
  id: string;
  name: string;
  icon: string;            // key icon FE map
  order?: number;
}

export interface SuggestionItem {
  id: string;
  title: string;
  imageUrl: string;
  conditionLabel?: string;
  quantity: number;
  rating?: number;         // 0..5
  endsInSec?: number;      // nếu là item đấu giá
  currentPrice: VND;
  currency: "VND";
}

export interface HomeResponse {
  featuredAuction: AuctionItem | null;
  categories: Category[];
  suggestions: {
    items: SuggestionItem[];
    page: number;
    pageSize: number;
    total: number;
  };
}
