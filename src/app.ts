import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { routes } from './api/routes';
import { errorHandler, notFoundHandler } from './api/middlewares/error.middleware';
import { swaggerSpec } from './config/swagger';

/** Crea y configura la app de Express: JSON, Swagger, rutas, 404 y errores. */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
