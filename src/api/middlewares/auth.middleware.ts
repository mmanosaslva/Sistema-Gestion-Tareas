import { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { Config } from '../../config/config';
import { AuthenticationError } from '../../errors/AuthenticationError';

/**
 * Verifica "Authorization: Bearer <token>".
 * Cabecera ausente, mal formada, token inválido o expirado → AuthenticationError (401).
 * Si el token es válido, deja el id del usuario en req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    throw new AuthenticationError();
  }

  const token = header.slice('Bearer '.length);

  const config = Config.getInstance();
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new AuthenticationError();
  }

  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new AuthenticationError();
  }

  req.user = { id: payload.sub };
  next();
}
