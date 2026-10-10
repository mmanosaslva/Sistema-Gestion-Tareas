import { createUser, findUserByEmail } from '../persistence/user.repository';
import type { User, UserPublic } from '../types/user.types';

/**
 * Email en minúsculas: se guarda y se busca siempre así.
 * No hace falta trim: AJV (format "email") ya rechaza emails con espacios.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase();
}

/** Quita password_hash: nunca sale por la API. */
export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    created_at: user.created_at,
  };
}

/** Busca un usuario por email ya normalizado. */
export async function findUserByEmailNormalized(email: string): Promise<User | null> {
  return findUserByEmail(normalizeEmail(email));
}

/**
 * Crea un usuario. Si dos registros con el mismo email llegan a la vez,
 * el repositorio traduce la restricción UNIQUE de la BD a ConflictError (409).
 */
export async function saveUser(data: {
  nombre: string;
  email: string;
  password_hash: string;
}): Promise<User> {
  return createUser(data);
}
