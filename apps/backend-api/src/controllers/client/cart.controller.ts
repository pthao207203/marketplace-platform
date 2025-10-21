import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { addToCartForUser, getCartForUser } from '../../services/cart.service';

// Add an item to the user's cart. Body: { productId, qty }
export async function addToCart(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const { productId, qty } = req.body as { productId?: string; qty?: number };
    if (!productId || !Types.ObjectId.isValid(productId)) return res.status(400).json({ success: false, error: { message: 'Invalid productId' } });
    const q = typeof qty === 'number' && qty > 0 ? Math.floor(qty) : 1;

    const cart = await addToCartForUser(String(userId), productId, q);
    return res.json({ success: true, data: { cart } });
  } catch (err: any) {
    console.error('addToCart error', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', details: err?.message } });
  }
}

// Return current user's cart
export async function viewCart(req: Request, res: Response) {
  try {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  const cart = await getCartForUser(String(userId));
  return res.json({ success: true, data: { cart } });
  } catch (err: any) {
    console.error('viewCart error', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', details: err?.message } });
  }
}
