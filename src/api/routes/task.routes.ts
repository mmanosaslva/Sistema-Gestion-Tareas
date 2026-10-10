import { Router } from 'express';
import { createTask, listTasks } from '../../controllers/task.controller';
import { createTaskSchema } from '../../schemas/task.schema';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

export const taskRoutes: Router = Router();

taskRoutes.use(authenticate);
taskRoutes.post('/', validate(createTaskSchema), createTask);
taskRoutes.get('/', listTasks);
