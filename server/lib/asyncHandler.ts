import type { Request, Response } from "express";

// Wraps a route handler so a thrown/rejected error becomes a uniform
// 500 JSON response, instead of repeating the same try/catch in every
// one of the ~40 CRUD handlers that use it.
export function asyncHandler(fn: (req: Request, res: Response) => Promise<any>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
