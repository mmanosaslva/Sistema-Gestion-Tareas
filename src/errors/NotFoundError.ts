import { AppError } from './AppError';

/**
 * Recurso no encontrado (HTTP 404).
 * También se usa para tareas de otros usuarios (no revelar su existencia).
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(404, message);
  }
}
