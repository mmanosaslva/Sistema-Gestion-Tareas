import { Prisma } from '@prisma/client';
import { ConflictError } from '../errors/ConflictError';
import { createUser, findUserByEmail } from '../persistence/user.repository';
import type { User, UserPublic } from '../types/user.types';

/** Email en minúsculas y sin espacios: se guarda y se busca siempre así. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
 * Crea un usuario. El email duplicado responde ConflictError (409):
 * se comprueba antes y, además, la restricción UNIQUE de la BD
 * (P2002) se traduce a 409 por si dos peticiones llegan a la vez.
 */
export async function saveUser(data: {
  nombre: string;
  email: string;
  password_hash: string;
}): Promise<User> {
  try {
    return await createUser(data);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('El email ya está registrado');
    }
    throw error;
  }
}
