import { NextRequest, NextResponse } from 'next/server';

export default function initMiddleware(
  middleware: (
    req: NextRequest,
    res: NextResponse,
    next: (err?: any) => any
  ) => void
) {
  return (req: NextRequest, res: NextResponse) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}
