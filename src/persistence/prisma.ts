import { PrismaClient } from '@prisma/client';
import { Config } from '../config/config';

const config = Config.getInstance();

/**
 * Instancia única de PrismaClient (Singleton).
 * Reutilizada por todos los repositorios.
 */
export const prisma: PrismaClient = new PrismaClient({
  datasources: {
    db: { url: config.DATABASE_URL },
  },
});
