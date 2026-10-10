import { createTask, findTasksByUser } from '../persistence/task.repository';
import type {
  CreateTaskInput,
  Task,
  TaskEstado,
  TaskPublic,
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
