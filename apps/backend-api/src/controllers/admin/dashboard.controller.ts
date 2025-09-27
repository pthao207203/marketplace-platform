import type { Request, Response } from 'express'

export async function index(req: Request, res: Response) {
  return res.json({ ok: true, page: 'admin-dashboard' })
}

export async function stats(req: Request, res: Response) {
  return res.json({ ok: true, page: 'admin-dashboard' })
}