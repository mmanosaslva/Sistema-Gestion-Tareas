import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Config } from '../config/config';
import { AuthenticationError } from '../errors/AuthenticationError';
import { ConflictError } from '../errors/ConflictError';
import {
  findUserByEmailNormalized,
  normalizeEmail,
  saveUser,
  toPublicUser,
} from './user.service';
import type {
  CreateUserInput,
  LoginInput,
  LoginResponse,
  UserPublic,
} from '../types/user.types';

const SALT_ROUNDS = 10;
const GENERIC_CREDENTIALS_ERROR = 'Credenciales incorrectas';

/**
 * Hash usado cuando el email no existe: bcrypt.compare se ejecuta siempre
 * y el login tarda lo mismo exista o no el usuario (evita enumerar emails por tiempo).
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

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

/**
 * Login: verifica credenciales y firma un JWT (HS256) con payload solo `sub`.
 * Email inexistente y contraseña incorrecta devuelven el mismo 401
 * y tardan lo mismo, para no revelar cuál de los dos falló.
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  const config = Config.getInstance();
  const user = await findUserByEmailNormalized(input.email);

  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.password_hash ?? DUMMY_PASSWORD_HASH
  );
  if (user === null || !passwordMatches) {
    throw new AuthenticationError(GENERIC_CREDENTIALS_ERROR);
  }

  const token = jwt.sign({ sub: user.id }, config.JWT_SECRET, {
    algorithm: 'HS256',
    // JWT_EXPIRES_IN es string libre ('1h', '30m'); jsonwebtoken valida el formato en runtime
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { token };
}
