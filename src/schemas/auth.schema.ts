import type { ValidateFunction } from 'ajv';
import { ajv } from './ajv';

const registerSchemaObject = {
  type: 'object',
  properties: {
    nombre: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
  },
  required: ['nombre', 'email', 'password'],
  additionalProperties: false,
};

const loginSchemaObject = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
  },
  required: ['email', 'password'],
  additionalProperties: false,
};

/** Valida el body de POST /auth/register */
export const registerSchema: ValidateFunction = ajv.compile(registerSchemaObject);

/** Valida el body de POST /auth/login */
export const loginSchema: ValidateFunction = ajv.compile(loginSchemaObject);
