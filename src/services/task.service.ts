import { NotFoundError } from '../errors/NotFoundError';
import {
  createTask,
  deleteTaskForUser as deleteTaskRepo,
  findTaskByIdForUser,
  findTasksByUser,
  updateTaskForUser as updateTaskRepo,
} from '../persistence/task.repository';
import type {
  CreateTaskInput,
  Task,
  TaskEstado,
  TaskPublic,
  UpdateTaskInput,
} from '../types/task.types';

/**
 * Convierte una entidad Task a su forma pública.
 * fecha_vencimiento es @db.Date: Prisma devuelve Date a medianoche UTC;
 * se formatea a "YYYY-MM-DD" con toISOString para no desplazar un día.
 */
export function toPublicTask(task: Task): TaskPublic {
  return {
    id: task.id,
    titulo: task.titulo,
    descripcion: task.descripcion,
    fecha_vencimiento:
      task.fecha_vencimiento !== null ? task.fecha_vencimiento.toISOString().slice(0, 10) : null,
    estado: task.estado as TaskEstado,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };
}

/**
 * Crea una tarea para el usuario autenticado.
 * Lista blanca de campos: el user_id nunca viene del body (riesgo de mass assignment).
 * estado por defecto 'pendiente' lo pone la BD; fecha "YYYY-MM-DD" se convierte a Date UTC.
 */
export async function createTaskForUser(
  userId: string,
  input: CreateTaskInput
): Promise<TaskPublic> {
  const data: {
    user_id: string;
    titulo: string;
    descripcion?: string;
    fecha_vencimiento?: Date;
    estado?: TaskEstado;
  } = {
    user_id: userId,
    titulo: input.titulo,
  };

  if (input.descripcion !== undefined) {
    data.descripcion = input.descripcion;
  }
  if (input.fecha_vencimiento !== undefined) {
    data.fecha_vencimiento = new Date(input.fecha_vencimiento);
  }
  if (input.estado !== undefined) {
    data.estado = input.estado;
  }

  const task = await createTask(data);
  return toPublicTask(task);
}

/** Lista solo las tareas del usuario autenticado. */
export async function listTasksForUser(userId: string): Promise<TaskPublic[]> {
  const tasks = await findTasksByUser(userId);
  return tasks.map(toPublicTask);
}

/**
 * Obtiene una tarea propia. Si no existe o es de otro usuario
 * responde NotFoundError (404) — misma respuesta a propósito.
 */
export async function getTaskForUser(id: string, userId: string): Promise<TaskPublic> {
  const task = await findTaskByIdForUser(id, userId);
  if (task === null) {
    throw new NotFoundError('Tarea no encontrada');
  }
  return toPublicTask(task);
}

/**
 * Actualiza una tarea propia (parcial). Lista blanca campo por campo:
 * el body nunca se pasa crudo a Prisma (evita cambiar user_id o id).
 * Si el where no matchea (id inexistente o tarea ajena) → 404.
 */
export async function updateTaskForUser(
  id: string,
  userId: string,
  input: UpdateTaskInput
): Promise<TaskPublic> {
  const data: {
    titulo?: string;
    descripcion?: string;
    fecha_vencimiento?: Date;
    estado?: TaskEstado;
  } = {};

  if (input.titulo !== undefined) {
    data.titulo = input.titulo;
  }
  if (input.descripcion !== undefined) {
    data.descripcion = input.descripcion;
  }
  if (input.fecha_vencimiento !== undefined) {
    data.fecha_vencimiento = new Date(input.fecha_vencimiento);
  }
  if (input.estado !== undefined) {
    data.estado = input.estado;
  }

  const count = await updateTaskRepo(id, userId, data);
  if (count === 0) {
    throw new NotFoundError('Tarea no encontrada');
  }

  const task = await findTaskByIdForUser(id, userId);
  if (task === null) {
    throw new NotFoundError('Tarea no encontrada');
  }
  return toPublicTask(task);
}

/** Elimina una tarea propia. Id inexistente o ajena → 404. */
export async function deleteTaskForUser(id: string, userId: string): Promise<void> {
  const count = await deleteTaskRepo(id, userId);
  if (count === 0) {
    throw new NotFoundError('Tarea no encontrada');
  }
}
