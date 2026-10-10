import { prisma } from './prisma';
import type { Task } from '../types/task.types';

/** Crea una tarea. user_id SIEMPRE sale del token, nunca del body. */
export async function createTask(data: {
  user_id: string;
  titulo: string;
  descripcion?: string;
  fecha_vencimiento?: Date;
  estado?: string;
}): Promise<Task> {
  return prisma.task.create({ data });
}

/** Lista las tareas de un usuario (where filtra por user_id). */
export async function findTasksByUser(userId: string): Promise<Task[]> {
  return prisma.task.findMany({ where: { user_id: userId } });
}

/** Busca una tarea por id Y user_id: tareas ajenas se comportan como inexistentes. */
export async function findTaskByIdForUser(id: string, userId: string): Promise<Task | null> {
  return prisma.task.findFirst({ where: { id, user_id: userId } });
}

/**
 * Actualiza una tarea propia. updateMany con { id, user_id } en el where:
 * count === 0 significa que no existe o es de otro usuario.
 */
export async function updateTaskForUser(
  id: string,
  userId: string,
  data: {
    titulo?: string;
    descripcion?: string;
    fecha_vencimiento?: Date;
    estado?: string;
  }
): Promise<number> {
  const result = await prisma.task.updateMany({
    where: { id, user_id: userId },
    data,
  });
  return result.count;
}

/** Elimina una tarea propia. count === 0 → no existe o es de otro usuario. */
export async function deleteTaskForUser(id: string, userId: string): Promise<number> {
  const result = await prisma.task.deleteMany({
    where: { id, user_id: userId },
  });
  return result.count;
}
