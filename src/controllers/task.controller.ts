import { type Request, type Response } from 'express';
import { AuthenticationError } from '../errors/AuthenticationError';
import {
  createTaskForUser,
  listTasksForUser,
} from '../services/task.service';
import type { CreateTaskInput } from '../types/task.types';

/** El user_id solo sale de req.user (puesto por el middleware de auth). */
function requireUserId(req: Request): string {
  const id = req.user?.id;
  if (id === undefined) {
    throw new AuthenticationError();
  }
  return id;
}

/** POST /tasks — 201 con la tarea creada (estado 'pendiente' por defecto). */
export async function createTask(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateTaskInput;
  const task = await createTaskForUser(requireUserId(req), input);
  res.status(201).json(task);
}

/** GET /tasks — 200 con el array de tareas propias (vacío si no hay). */
export async function listTasks(req: Request, res: Response): Promise<void> {
  const tasks = await listTasksForUser(requireUserId(req));
  res.status(200).json(tasks);
}
