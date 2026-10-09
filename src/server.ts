import { createApp } from './app';
import { Config } from './config/config';
import { prisma } from './persistence/prisma';

const config = Config.getInstance();

const app = createApp();

async function main(): Promise<void> {
  await prisma.$connect();
  app.listen(config.PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${config.PORT}`);
  });
}

void main();
