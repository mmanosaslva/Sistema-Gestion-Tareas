import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { User } from '../../src/types/user.types';
import type { Task } from '../../src/types/task.types';

const usersByEmail = new Map<string, User>();
const tasksById = new Map<string, Task>();

vi.mock('../../src/persistence/user.repository', () => ({
  findUserByEmail: vi.fn(async (email: string) => usersByEmail.get(email) ?? null),
  createUser: vi.fn(async (data: { nombre: string; email: string; password_hash: string }) => {
    const user: User = {
      id: randomUUID(),
      nombre: data.nombre,
      email: data.email,
      password_hash: data.password_hash,
      created_at: new Date(),
    };
    usersByEmail.set(user.email, user);
    return user;
  }),
}));

vi.mock('../../src/persistence/task.repository', () => ({
  createTask: vi.fn(
    async (data: {
      user_id: string;
      titulo: string;
      descripcion?: string;
      fecha_vencimiento?: Date;
      estado?: string;
    }) => {
      const task: Task = {
        id: randomUUID(),
        titulo: data.titulo,
        descripcion: data.descripcion ?? null,
        fecha_vencimiento: data.fecha_vencimiento ?? null,
        estado: data.estado ?? 'pendiente',
        user_id: data.user_id,
        created_at: new Date(),
        updated_at: new Date(),
      };
      tasksById.set(task.id, task);
      return task;
    }
  ),
  findTasksByUser: vi.fn(async (userId: string) =>
    [...tasksById.values()].filter((t) => t.user_id === userId)
  ),
  findTaskByIdForUser: vi.fn(async (id: string, userId: string) => {
    const task = tasksById.get(id);
    return task !== undefined && task.user_id === userId ? task : null;
  }),
  updateTaskForUser: vi.fn(async (id: string, userId: string, data: Partial<Task>) => {
    const task = tasksById.get(id);
    if (task === undefined || task.user_id !== userId) {
      return 0;
    }
    Object.assign(task, data, { updated_at: new Date() });
    return 1;
  }),
  deleteTaskForUser: vi.fn(async (id: string, userId: string) => {
    const task = tasksById.get(id);
    if (task === undefined || task.user_id !== userId) {
      return 0;
    }
    tasksById.delete(id);
    return 1;
  }),
}));

import { createApp } from '../../src/app';

const app = createApp();

async function register(email: string): Promise<void> {
  await request(app)
    .post('/auth/register')
    .send({ nombre: 'Usuario', email, password: 'Secreta123' })
    .expect(201);
}

async function login(email: string): Promise<string> {
  const res = await request(app)
    .post('/auth/login')
    .send({ email, password: 'Secreta123' })
    .expect(200);
  return res.body.token as string;
}

beforeEach(() => {
  usersByEmail.clear();
  tasksById.clear();
});

describe('aislamiento entre usuarios (integración)', () => {
  it('cada usuario solo ve, edita y borra sus propias tareas', async () => {
    await register('user.a@example.com');
    await register('user.b@example.com');
    const tokenA = await login('user.a@example.com');
    const tokenB = await login('user.b@example.com');

    const createdA = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ titulo: 'Tarea de A' })
      .expect(201);
    expect(createdA.body.estado).toBe('pendiente');
    const idA = createdA.body.id as string;

    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ titulo: 'Tarea de B' })
      .expect(201);

    const listA = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(listA.body).toHaveLength(1);
    expect(listA.body[0].titulo).toBe('Tarea de A');

    const listB = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(listB.body).toHaveLength(1);
    expect(listB.body[0].titulo).toBe('Tarea de B');

    await request(app)
      .get(`/tasks/${idA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    await request(app)
      .put(`/tasks/${idA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ titulo: 'hackeada' })
      .expect(404);

    await request(app)
      .delete(`/tasks/${idA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    const unchanged = await request(app)
      .get(`/tasks/${idA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(unchanged.body.titulo).toBe('Tarea de A');

    await request(app)
      .put(`/tasks/${idA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ titulo: 'Editada por A' })
      .expect(200);

    await request(app)
      .delete(`/tasks/${idA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);

    await request(app)
      .get(`/tasks/${idA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  it('rutas de tareas sin token responden 401', async () => {
    await request(app).get('/tasks').expect(401);
    await request(app).post('/tasks').send({ titulo: 'x' }).expect(401);
  });

  it('PUT vacío responde 400 y PUT con user_id responde 400', async () => {
    await register('user.a@example.com');
    const token = await login('user.a@example.com');
    const created = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Original' })
      .expect(201);

    await request(app)
      .put(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    await request(app)
      .put(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: 'otro-uuid' })
      .expect(400);
  });
});
