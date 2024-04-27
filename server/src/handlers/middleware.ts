import { Request, Response, NextFunction } from 'express';

export const handleVerifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') return next();

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is missing' });
  }

  if (apiKey !== process.env.SERVER_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};
