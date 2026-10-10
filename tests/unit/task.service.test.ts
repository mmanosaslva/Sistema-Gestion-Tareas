import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../src/errors/NotFoundError';
import {
  createTaskForUser,
  getTaskForUser,
  toPublicTask,
  updateTaskForUser,
} from '../../src/services/task.service';
import type { Task } from '../../src/types/task.types';

vi.mock('../../src/persistence/task.repository', () => ({
  createTask: vi.fn(),
  findTasksByUser: vi.fn(),
  findTaskByIdForUser: vi.fn(),
  updateTaskForUser: vi.fn(),
  deleteTaskForUser: vi.fn(),
}));

import {
  createTask,
  findTaskByIdForUser,
  updateTaskForUser as updateTaskRepo,
} from '../../src/persistence/task.repository';

const createTaskMock = vi.mocked(createTask);
const findTaskByIdForUserMock = vi.mocked(findTaskByIdForUser);
const updateTaskRepoMock = vi.mocked(updateTaskRepo);

const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    titulo: 'Tarea',
    descripcion: null,
    fecha_vencimiento: null,
    estado: 'pendiente',
    user_id: USER_ID,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('task.service toPublicTask', () => {
  it('formatea fecha @db.Date (medianoche UTC) como YYYY-MM-DD sin desplazar día', () => {
    const task = makeTask({ fecha_vencimiento: new Date('2026-10-15T00:00:00.000Z') });
    expect(toPublicTask(task).fecha_vencimiento).toBe('2026-10-15');
  });

  it('fecha null queda null', () => {
    expect(toPublicTask(makeTask()).fecha_vencimiento).toBeNull();
  });
});

describe('task.service createTaskForUser', () => {
  it('user_id sale del argumento (token) y no de campos extra', async () => {
    createTaskMock.mockResolvedValue(makeTask());

    await createTaskForUser(USER_ID, { titulo: 'Nueva' });

    const data = createTaskMock.mock.calls[0][0];
    expect(data.user_id).toBe(USER_ID);
    expect(data.titulo).toBe('Nueva');
    expect(data).not.toHaveProperty('id');
  });

  it('convierte fecha YYYY-MM-DD a Date UTC', async () => {
    createTaskMock.mockResolvedValue(makeTask());

    await createTaskForUser(USER_ID, { titulo: 'Nueva', fecha_vencimiento: '2026-10-15' });

    const data = createTaskMock.mock.calls[0][0];
    expect(data.fecha_vencimiento?.toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });
});

describe('task.service getTaskForUser', () => {
  it('tarea inexistente o ajena responde NotFoundError', async () => {
    findTaskByIdForUserMock.mockResolvedValue(null);
    await expect(getTaskForUser('no-id', USER_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('task.service updateTaskForUser', () => {
  it('count 0 (id inexistente o tarea ajena) responde NotFoundError', async () => {
    updateTaskRepoMock.mockResolvedValue(0);
    await expect(
      updateTaskForUser('no-id', USER_ID, { titulo: 'x' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('actualiza solo los campos enviados (lista blanca)', async () => {
    updateTaskRepoMock.mockResolvedValue(1);
    findTaskByIdForUserMock.mockResolvedValue(makeTask({ descripcion: 'editada' }));

    const result = await updateTaskForUser('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', USER_ID, {
      descripcion: 'editada',
    });

    const data = updateTaskRepoMock.mock.calls[0][2];
    expect(Object.keys(data)).toEqual(['descripcion']);
    expect(result.descripcion).toBe('editada');
  });
});
