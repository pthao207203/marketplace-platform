import { Request, Response } from "express";
import { getHomeData } from "../../services/product.service";

export async function getHome(req: Request, res: Response) {
  const data = await getHomeData(req.query);
  res.json(data);
}
