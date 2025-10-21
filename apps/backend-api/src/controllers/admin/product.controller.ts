import { Request, Response } from 'express';
import { listProducts, createProduct } from '../../services/product.service';

export async function getProducts(req: Request, res: Response) {
  const data = await listProducts(req.query);
  res.json(data);
}

export async function postProduct(req: Request, res: Response) {
  const created = await createProduct(req.body);
  res.status(201).json(created);
}
