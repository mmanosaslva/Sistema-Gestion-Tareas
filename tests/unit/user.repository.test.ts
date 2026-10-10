import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../src/errors/ConflictError';

vi.mock('../../src/persistence/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: Prisma.prismaVersion.client,
        });
      }),
    },
  },
}));

import { createUser } from '../../src/persistence/user.repository';

describe('user.repository createUser', () => {
  it('traduce P2002 (email duplicado) a ConflictError en la capa de persistencia', async () => {
    await expect(
      createUser({ nombre: 'Ana', email: 'ana@example.com', password_hash: 'hash' })
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
