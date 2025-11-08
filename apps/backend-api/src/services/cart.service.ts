import { UserModel } from "../models/user.model";
import { Types } from "mongoose";

export async function addToCartForUser(
  userId: string,
  productId: string,
  qty: number
) {
  if (!Types.ObjectId.isValid(productId)) throw new Error("Invalid productId");

  const user = await UserModel.findById(String(userId));
  if (!user) throw new Error("User not found");

  const q = typeof qty === "number" && qty > 0 ? Math.floor(qty) : 1;

  const existing = user.userCart.find(
    (c: any) => String(c.productId) === String(productId)
  );
  if (existing) {
    existing.qty = existing.qty + q;
    existing.addedAt = new Date();
  } else {
    user.userCart.push({ productId: productId, qty: q, price: 0 });
  }

  await user.save();
  return user.userCart;
}

export async function getCartForUser(userId: string) {
  const user = (await UserModel.findById(String(userId))
    .select("userCart")
    .lean()) as unknown as { userCart: any[] } | null;
  if (!user) throw new Error("User not found");
  return user.userCart;
}

export async function removeFromCartForUser(userId: string, productId: string) {
  if (!Types.ObjectId.isValid(productId)) throw new Error("Invalid productId");

  const user = await UserModel.findById(String(userId));
  if (!user) throw new Error("User not found");

  const before = user.userCart.length;
  user.userCart = user.userCart.filter(
    (c: any) => String(c.productId) !== String(productId)
  );

  if (user.userCart.length === before) {
    // nothing removed; treat as success but unchanged
  }

  await user.save();
  return user.userCart;
}
