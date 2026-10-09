import { AppError } from './AppError';

/**
 * Error de validación de datos de entrada (HTTP 400).
 * details contiene la lista de campos inválidos.
 */
export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos', details?: readonly unknown[]) {
    super(400, message, details);
  }
}
