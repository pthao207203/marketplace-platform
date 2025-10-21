export type VND = number;
export interface AuctionItem {
    id: string;
    title: string;
    imageUrl: string;
    quantity: number;
    currentPrice: VND;
    currency: "VND";
    endsAt: string;
    condition?: string;
    featured?: boolean;
}
export interface Category {
    id: string;
    name: string;
    icon: string;
    order?: number;
}
export interface SuggestionItem {
    id: string;
    title: string;
    imageUrl: string;
    conditionLabel?: string;
    quantity: number;
    rating?: number;
    endsInSec?: number;
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
