import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { taskRoutes } from './task.routes';

export const routes: Router = Router();

routes.use('/auth', authRoutes);
routes.use('/tasks', taskRoutes);
