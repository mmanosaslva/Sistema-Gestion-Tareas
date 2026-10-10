import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { NotFoundError } from '../../errors/NotFoundError';
import { ValidationError } from '../../errors/ValidationError';

/**
 * express.json() lanza un error con type 'entity.parse.failed'
 * cuando el cuerpo no es JSON válido: es un error del cliente (400), no del servidor.
 */
function isJsonParseError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  );
}

/**
 * Middleware centralizado de errores (Express 5: 4 parámetros).
 * AppError se responde con su statusCode y formato { error: { name, message, details? } }.
 * El JSON mal formado se convierte en ValidationError (400).
 * Cualquier otro error responde 500 con mensaje genérico; el detalle se loguea aquí.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const error = isJsonParseError(err)
    ? new ValidationError('El cuerpo de la petición no es un JSON válido')
    : err;

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        name: error.name,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  console.error(error);
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
