import dotenv from 'dotenv';

/**
 * Configuración centralizada de la aplicación.
 * Patrón Singleton: el .env se carga y valida una sola vez.
 * Solo esta clase lee process.env.
 */
export class Config {
  private static instance: Config | null = null;

  readonly PORT: number;
  readonly DATABASE_URL: string;
  readonly DIRECT_URL: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: string;

  private constructor() {
    dotenv.config();

    const databaseUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;

    if (!databaseUrl) {
      throw new Error(
        'Falta la variable de entorno DATABASE_URL. Copia .env.example a .env y complétala.'
      );
    }
    if (!jwtSecret) {
      throw new Error(
        'Falta la variable de entorno JWT_SECRET. Copia .env.example a .env y complétala.'
      );
    }

    const port = Number(process.env.PORT);
    this.PORT = Number.isInteger(port) && port > 0 ? port : 3000;
    this.DATABASE_URL = databaseUrl;
    this.DIRECT_URL = process.env.DIRECT_URL ?? '';
    this.JWT_SECRET = jwtSecret;
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
  }

  /** Devuelve la única instancia; la primera llamada carga y valida el .env. */
  static getInstance(): Config {
    if (Config.instance === null) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}
