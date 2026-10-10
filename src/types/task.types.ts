/** Estados posibles de una tarea (mismos valores que el CHECK de la BD). */
export type TaskEstado = 'pendiente' | 'en curso' | 'completada';

/** Entidad Task tal como vive en la base de datos. */
export interface Task {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: Date | null;
  estado: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

/** Task sin campos internos: única forma que sale por la API. */
export interface TaskPublic {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: TaskEstado;
  created_at: Date;
  updated_at: Date;
}

/** Datos de entrada para crear una tarea (ya validados por AJV). */
export interface CreateTaskInput {
  titulo: string;
  descripcion?: string;
  fecha_vencimiento?: string;
  estado?: TaskEstado;
}
