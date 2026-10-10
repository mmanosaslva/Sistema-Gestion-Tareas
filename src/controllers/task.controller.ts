import { type Request, type Response } from 'express';
import { AuthenticationError } from '../errors/AuthenticationError';
import { ValidationError } from '../errors/ValidationError';
import {
  createTaskForUser,
  deleteTaskForUser,
  getTaskForUser,
  listTasksForUser,
  updateTaskForUser,
} from '../services/task.service';
import type { CreateTaskInput, UpdateTaskInput } from '../types/task.types';

/** El user_id solo sale de req.user (puesto por el middleware de auth). */
function requireUserId(req: Request): string {
  const id = req.user?.id;
  if (id === undefined) {
    throw new AuthenticationError();
  }
  return id;
}

/** Express 5 tipa params como string | string[]; AJV ya garantizó un uuid simple. */
function requireTaskId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string') {
    throw new ValidationError('Parámetros inválidos');
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

/** GET /tasks/:id — 200 con la tarea propia; ajena o inexistente → 404. */
export async function getTask(req: Request, res: Response): Promise<void> {
  const task = await getTaskForUser(requireTaskId(req), requireUserId(req));
  res.status(200).json(task);
}

/** PUT /tasks/:id — 200 con la tarea actualizada; parcial; ajena o inexistente → 404. */
export async function updateTask(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateTaskInput;
  const task = await updateTaskForUser(requireTaskId(req), requireUserId(req), input);
  res.status(200).json(task);
}

/** DELETE /tasks/:id — 204 sin cuerpo; ajena o inexistente → 404. */
export async function deleteTask(req: Request, res: Response): Promise<void> {
  await deleteTaskForUser(requireTaskId(req), requireUserId(req));
  res.status(204).end();
}
