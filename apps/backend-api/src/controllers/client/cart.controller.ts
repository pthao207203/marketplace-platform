import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { addToCartForUser, getCartForUser } from '../../services/cart.service';
import { sendSuccess, sendError } from '../../utils/response';

// Add an item to the user's cart. Body: { productId, qty }
export async function addToCart(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
  if (!userId) return sendError(res, 401, 'Unauthorized');

    const { productId, qty } = req.body as { productId?: string; qty?: number };
  if (!productId || !Types.ObjectId.isValid(productId)) return sendError(res, 400, 'Invalid productId');
    const q = typeof qty === 'number' && qty > 0 ? Math.floor(qty) : 1;

  const cart = await addToCartForUser(String(userId), productId, q);
  return sendSuccess(res, { cart });
  } catch (err: any) {
    console.error('addToCart error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

// Return current user's cart
export async function viewCart(req: Request, res: Response) {
  try {
  const userId = req.user?.sub;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  const cart = await getCartForUser(String(userId));
  return sendSuccess(res, { cart });
  } catch (err: any) {
    console.error('viewCart error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}
