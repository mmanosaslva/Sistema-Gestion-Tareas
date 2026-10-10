import express, { type Express } from 'express';
import { routes } from './api/routes';
import { errorHandler, notFoundHandler } from './api/middlewares/error.middleware';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
