import { AppError } from './AppError';

/**
 * Conflicto con el estado actual del recurso (HTTP 409).
 * Uso previsto: email ya registrado.
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflicto') {
    super(409, message);
  }
}
