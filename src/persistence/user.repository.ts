import { prisma } from './prisma';
import type { User } from '../types/user.types';

/** Busca un usuario por email (ya normalizado por el service). */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

/** Inserta un usuario con el hash de la contraseña ya calculado. */
export async function createUser(data: {
  nombre: string;
  email: string;
  password_hash: string;
}): Promise<User> {
  return prisma.user.create({ data });
}
