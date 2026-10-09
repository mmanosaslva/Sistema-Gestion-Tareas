import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { NotFoundError } from '../../errors/NotFoundError';

/**
 * Middleware centralizado de errores (Express 5: 4 parámetros).
 * AppError se responde con su statusCode y formato { error: { name, message, details? } }.
 * Cualquier otro error responde 500 con mensaje genérico; el detalle se loguea aquí.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        name: err.name,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      name: 'InternalError',
      message: 'Error interno del servidor',
    },
  });
}

/**
 * Rutas inexistentes: lanza NotFoundError y el errorHandler responde 404.
 */
export function notFoundHandler(req: Request): never {
  throw new NotFoundError(`Ruta no encontrada: ${req.method} ${req.path}`);
}
