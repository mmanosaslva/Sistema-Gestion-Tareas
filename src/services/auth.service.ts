import bcrypt from 'bcrypt';
import { ConflictError } from '../errors/ConflictError';
import {
  findUserByEmailNormalized,
  normalizeEmail,
  saveUser,
  toPublicUser,
} from './user.service';
import type { CreateUserInput, UserPublic } from '../types/user.types';

const SALT_ROUNDS = 10;

/**
 * Registro de usuario: normaliza el email, rechaza duplicados (409),
 * hashea la contraseña con bcrypt (10 rounds) y guarda el usuario.
 * Devuelve el usuario público sin password_hash.
 */
export async function register(input: CreateUserInput): Promise<UserPublic> {
  const email = normalizeEmail(input.email);

  const existing = await findUserByEmailNormalized(email);
  if (existing !== null) {
    throw new ConflictError('El email ya está registrado');
  }

  const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await saveUser({ nombre: input.nombre, email, password_hash });

  return toPublicUser(user);
}
