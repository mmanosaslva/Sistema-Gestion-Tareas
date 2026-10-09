import { AppError } from './AppError';

/**
 * Error de autenticación (HTTP 401):
 * token ausente, inválido o expirado; credenciales incorrectas.
 */
export class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(401, message);
  }
}
