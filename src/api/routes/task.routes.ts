import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../../controllers/task.controller';
import {
  createTaskSchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from '../../schemas/task.schema';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

export const taskRoutes: Router = Router();

taskRoutes.use(authenticate);
taskRoutes.post('/', validate(createTaskSchema), createTask);
taskRoutes.get('/', listTasks);
taskRoutes.get('/:id', validate(taskIdParamsSchema, 'params'), getTask);
taskRoutes.put(
  '/:id',
  validate(taskIdParamsSchema, 'params'),
  validate(updateTaskSchema),
  updateTask
);
taskRoutes.delete('/:id', validate(taskIdParamsSchema, 'params'), deleteTask);
