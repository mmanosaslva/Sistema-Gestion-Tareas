import type { ValidateFunction } from 'ajv';
import { ajv } from './ajv';

const estadoEnum = ['pendiente', 'en curso', 'completada'];

const createTaskSchemaObject = {
  type: 'object',
  properties: {
    titulo: { type: 'string', minLength: 1, pattern: '\\S' },
    descripcion: { type: 'string' },
    fecha_vencimiento: { type: 'string', format: 'date' },
    estado: { type: 'string', enum: estadoEnum },
  },
  required: ['titulo'],
  additionalProperties: false,
};

const updateTaskSchemaObject = {
  type: 'object',
  properties: {
    titulo: { type: 'string', minLength: 1, pattern: '\\S' },
    descripcion: { type: 'string' },
    fecha_vencimiento: { type: 'string', format: 'date' },
    estado: { type: 'string', enum: estadoEnum },
  },
  minProperties: 1,
  additionalProperties: false,
};

const taskIdParamsSchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
  required: ['id'],
  additionalProperties: false,
};

/** Valida el body de POST /tasks */
export const createTaskSchema: ValidateFunction = ajv.compile(createTaskSchemaObject);

/** Valida el body de PUT /tasks/:id (parcial, al menos un campo) */
export const updateTaskSchema: ValidateFunction = ajv.compile(updateTaskSchemaObject);

/** Valida los params de GET/PUT/DELETE /tasks/:id */
export const taskIdParamsSchema: ValidateFunction = ajv.compile(taskIdParamsSchemaObject);
