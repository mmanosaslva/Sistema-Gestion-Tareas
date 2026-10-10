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
