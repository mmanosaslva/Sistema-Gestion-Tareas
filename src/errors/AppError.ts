/**
 * Clase base de errores de la aplicación.
 * Lleva statusCode HTTP y se responde desde el middleware centralizado.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: readonly unknown[];

  constructor(statusCode: number, message: string, details?: readonly unknown[]) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
  }
}
