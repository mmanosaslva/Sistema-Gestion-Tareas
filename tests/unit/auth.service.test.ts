import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../../src/errors/AuthenticationError';
import { ConflictError } from '../../src/errors/ConflictError';
import { login, register } from '../../src/services/auth.service';
import type { User } from '../../src/types/user.types';

vi.mock('../../src/persistence/user.repository', () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

import {
  createUser,
  findUserByEmail,
} from '../../src/persistence/user.repository';

const findUserByEmailMock = vi.mocked(findUserByEmail);
const createUserMock = vi.mocked(createUser);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nombre: 'Ana',
    email: 'ana@example.com',
    password_hash: bcrypt.hashSync('Secreta123', 4),
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth.service register', () => {
  it('normaliza el email, hashea la contraseña y no devuelve password_hash', async () => {
    findUserByEmailMock.mockResolvedValue(null);
    createUserMock.mockImplementation(async (data) => ({
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      nombre: 'Ana',
      email: data.email,
      password_hash: data.password_hash,
      created_at: new Date('2026-01-01T00:00:00Z'),
    }));

    const result = await register({
      nombre: 'Ana',
      email: 'Ana@Test.Example.COM',
      password: 'Secreta123',
    });

    expect(findUserByEmailMock).toHaveBeenCalledWith('ana@test.example.com');
    const saved = createUserMock.mock.calls[0][0];
    expect(saved.email).toBe('ana@test.example.com');
    expect(saved.password_hash).toMatch(/^\$2b\$/);
    expect(saved.password_hash).not.toBe('Secreta123');
    expect(result).not.toHaveProperty('password_hash');
    expect(result.email).toBe('ana@test.example.com');
  });

  it('email ya registrado responde ConflictError', async () => {
    findUserByEmailMock.mockResolvedValue(makeUser());

    await expect(
      register({ nombre: 'Ana', email: 'ana@example.com', password: 'Secreta123' })
    ).rejects.toBeInstanceOf(ConflictError);
    expect(createUserMock).not.toHaveBeenCalled();
  });
});

describe('auth.service login', () => {
  it('credenciales correctas devuelven token con payload solo sub/iat/exp', async () => {
    findUserByEmailMock.mockResolvedValue(makeUser());

    const { token } = await login({ email: 'ana@example.com', password: 'Secreta123' });

    const decoded = jwt.decode(token, { complete: true });
    if (decoded === null || typeof decoded.payload === 'string') {
      throw new Error('token inválido');
    }
    expect(decoded.header.alg).toBe('HS256');
    expect(Object.keys(decoded.payload).sort()).toEqual(['exp', 'iat', 'sub']);
    expect(decoded.payload.sub).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });

  it('password incorrecta responde AuthenticationError con mensaje genérico', async () => {
    findUserByEmailMock.mockResolvedValue(makeUser());

    await expect(
      login({ email: 'ana@example.com', password: 'OtraClave99' })
    ).rejects.toThrow('Credenciales incorrectas');
  });

  it('email inexistente responde el mismo mensaje que password mala', async () => {
    findUserByEmailMock.mockResolvedValue(null);

    const error = await login({ email: 'no@existe.com', password: 'Secreta123' }).catch(
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(AuthenticationError);
    expect((error as AuthenticationError).message).toBe('Credenciales incorrectas');
  });

  it('email inexistente también ejecuta bcrypt.compare (mismo tiempo de respuesta)', async () => {
    findUserByEmailMock.mockResolvedValue(null);
    const compareSpy = vi.spyOn(bcrypt, 'compare');

    await login({ email: 'no@existe.com', password: 'Secreta123' }).catch(() => undefined);

    expect(compareSpy).toHaveBeenCalledTimes(1);
    compareSpy.mockRestore();
  });
});
