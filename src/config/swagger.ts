/**
 * Especificación OpenAPI 3 de la API.
 * Se sirve en /api-docs con swagger-ui-express.
 * Objeto tipado a mano (sin swagger-jsdoc): las rutas no se rastrean
 * con comentarios; el spec vive en un solo lugar.
 */

const errorResponse = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'NotFoundError' },
        message: { type: 'string', example: 'Tarea no encontrada' },
        details: {
          type: 'array',
          items: { type: 'object' },
          description: 'Solo en errores de validación (400)',
        },
      },
      required: ['name', 'message'],
    },
  },
  required: ['error'],
};

const unauthorizedResponse = {
  description: 'Token ausente, inválido o expirado; credenciales incorrectas',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
};

const badRequestResponse = {
  description: 'Datos de entrada inválidos',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
};

const notFoundResponse = {
  description: 'Recurso no encontrado (también si la tarea es de otro usuario)',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
};

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sistema de Gestión de Tareas — API REST',
    version: '1.0.0',
    description:
      'API RESTful para gestionar tareas personales. Cada usuario administra solo sus propias tareas. Autenticación con JWT (Bearer).',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth', description: 'Registro e inicio de sesión' },
    { name: 'Tasks', description: 'CRUD de tareas (protegido con Bearer token)' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar un usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuario creado (sin password_hash)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
          '400': badRequestResponse,
          '409': {
            description: 'Email ya registrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión y obtener un JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'JWT firmado (HS256, payload solo sub/iat/exp)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
        },
      },
    },
    '/tasks': {
      post: {
        tags: ['Tasks'],
        summary: 'Crear una tarea',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Tarea creada (estado por defecto: pendiente)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/TaskPublic' } },
            },
          },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
        },
      },
      get: {
        tags: ['Tasks'],
        summary: 'Listar mis tareas',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array de tareas del usuario autenticado (vacío si no hay)',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TaskPublic' },
                },
              },
            },
          },
          '401': unauthorizedResponse,
        },
      },
    },
    '/tasks/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'UUID de la tarea',
        },
      ],
      get: {
        tags: ['Tasks'],
        summary: 'Consultar una tarea propia',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'La tarea',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/TaskPublic' } },
            },
          },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
          '404': notFoundResponse,
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Actualizar una tarea propia (parcial)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTaskRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tarea actualizada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/TaskPublic' } },
            },
          },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
          '404': notFoundResponse,
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Eliminar una tarea propia',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Eliminada (sin cuerpo)' },
          '400': badRequestResponse,
          '401': unauthorizedResponse,
          '404': notFoundResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Pegar el token del login tras "Bearer "',
      },
    },
    schemas: {
      Error: errorResponse,
      RegisterRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, pattern: '\\S', example: 'Ana' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          password: { type: 'string', minLength: 8, example: 'Secreta123' },
        },
        required: ['nombre', 'email', 'password'],
        additionalProperties: false,
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          password: { type: 'string', minLength: 8, example: 'Secreta123' },
        },
        required: ['email', 'password'],
        additionalProperties: false,
      },
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          created_at: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'nombre', 'email', 'created_at'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
        },
        required: ['token'],
      },
      CreateTaskRequest: {
        type: 'object',
        properties: {
          titulo: { type: 'string', minLength: 1, pattern: '\\S', example: 'Estudiar TypeScript' },
          descripcion: { type: 'string', example: 'Genéricos y tipos utilitarios' },
          fecha_vencimiento: {
            type: 'string',
            format: 'date',
            example: '2026-10-15',
            description: 'Formato YYYY-MM-DD',
          },
          estado: { $ref: '#/components/schemas/Estado' },
        },
        required: ['titulo'],
        additionalProperties: false,
      },
      UpdateTaskRequest: {
        type: 'object',
        properties: {
          titulo: { type: 'string', minLength: 1, pattern: '\\S' },
          descripcion: { type: 'string' },
          fecha_vencimiento: { type: 'string', format: 'date', example: '2026-10-15' },
          estado: { $ref: '#/components/schemas/Estado' },
        },
        minProperties: 1,
        additionalProperties: false,
        description: 'Parcial: cualquier subconjunto de campos, al menos uno',
      },
      TaskPublic: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          titulo: { type: 'string' },
          descripcion: { type: 'string', nullable: true },
          fecha_vencimiento: {
            type: 'string',
            format: 'date',
            nullable: true,
            description: 'YYYY-MM-DD o null',
          },
          estado: { $ref: '#/components/schemas/Estado' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'titulo', 'descripcion', 'fecha_vencimiento', 'estado', 'created_at', 'updated_at'],
      },
      Estado: {
        type: 'string',
        enum: ['pendiente', 'en curso', 'completada'],
        default: 'pendiente',
      },
    },
  },
} as const;
