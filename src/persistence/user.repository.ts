import { Prisma } from '@prisma/client';
import { ConflictError } from '../errors/ConflictError';
import { prisma } from './prisma';
import type { User } from '../types/user.types';

/** Busca un usuario por email (ya normalizado por el service). */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Inserta un usuario con el hash de la contraseña ya calculado.
 * La restricción UNIQUE del email (P2002) se traduce aquí a ConflictError (409)
 * para que ninguna capa superior dependa de los errores de Prisma.
 */
export async function createUser(data: {
  nombre: string;
  email: string;
  password_hash: string;
}): Promise<User> {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('El email ya está registrado');
    }
    throw error;
  }
}
