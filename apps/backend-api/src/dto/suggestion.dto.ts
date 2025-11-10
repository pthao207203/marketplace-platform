// DTO & validator cho Suggestion (không map vào Mongo)
import { z } from "zod";

export const SuggestionDtoSchema = z.object({
  id: z.string(), // id logic (uuid/slug) hoặc id sản phẩm gốc
  title: z.string(),
  imageUrl: z.string().optional().default(""),
  conditionLabel: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  rating: z.number().min(0).max(5).optional(),
  endsInSec: z.number().int().nonnegative().optional(),
  currentPrice: z.number().nonnegative(),
  currency: z.literal("VND"),
  // optional price variant for product type (e.g., size/variant price)
  productPriceType: z.number().nonnegative().optional(),
});

export type SuggestionDto = z.infer<typeof SuggestionDtoSchema>;
