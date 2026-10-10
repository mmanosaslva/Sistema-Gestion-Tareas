import { createApp } from './app';
import { Config } from './config/config';
import { prisma } from './persistence/prisma';

const config = Config.getInstance();

const app = createApp();

/** Punto de entrada: conecta la BD (falla rápido si no) y arranca el servidor. */
async function main(): Promise<void> {
  await prisma.$connect();
  app.listen(config.PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${config.PORT}`);
  });
}

void main();
