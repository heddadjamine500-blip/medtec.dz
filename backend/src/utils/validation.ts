import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: 'Données de requête invalides',
        errors: result.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        message: 'Paramètres de requête invalides',
        errors: result.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    req.query = result.data as any;
    next();
  };
};
