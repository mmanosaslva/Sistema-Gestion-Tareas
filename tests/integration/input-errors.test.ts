import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/persistence/user.repository', () => ({
  findUserByEmail: vi.fn(async () => null),
  createUser: vi.fn(),
}));

vi.mock('../../src/persistence/task.repository', () => ({
  createTask: vi.fn(),
  findTasksByUser: vi.fn(),
  findTaskByIdForUser: vi.fn(),
  updateTaskForUser: vi.fn(),
  deleteTaskForUser: vi.fn(),
}));

import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';

const app = createApp();
const token = jwt.sign({ sub: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }, process.env.JWT_SECRET ?? '', {
  algorithm: 'HS256',
  expiresIn: '5m',
});

describe('errores de entrada (integración)', () => {
  it('JSON mal formado responde 400 ValidationError, no 500', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body.error.name).toBe('ValidationError');
  });

  it('titulo compuesto solo por espacios responde 400 al crear', async () => {
    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: '   ' })
      .expect(400);
  });

  it('titulo compuesto solo por espacios responde 400 al actualizar', async () => {
    await request(app)
      .put('/tasks/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: '   ' })
      .expect(400);
  });

  it('nombre compuesto solo por espacios responde 400 al registrar', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: '   ', email: 'ana@example.com', password: 'Secreta123' })
      .expect(400);
  });
});
