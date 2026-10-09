import { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ValidateFunction } from 'ajv';
import { ValidationError } from '../../errors/ValidationError';

type RequestPart = 'body' | 'params' | 'query';

/**
 * Middleware de validación con AJV.
 * Valida req[part] contra el JSON Schema compilado.
 * Si falla, lanza ValidationError (400) con la lista de errores en details;
 * el middleware centralizado de errores construye la respuesta.
 */
export function validate(schema: ValidateFunction, part: RequestPart = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[part];
    if (schema(data)) {
      next();
      return;
    }
    next(new ValidationError('Datos de entrada inválidos', schema.errors ?? []));
  };
}
