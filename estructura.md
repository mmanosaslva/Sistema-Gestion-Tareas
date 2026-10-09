# Estructura del Proyecto

API REST de gestión de tareas organizada **en capas**. Cada capa tiene una sola responsabilidad
y solo se comunica con la capa inmediatamente inferior:

```
Petición HTTP → api (rutas + middlewares) → controllers → services → persistence → PostgreSQL
```

## Árbol de carpetas

```
prueba-tecnica/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts        # POST /auth/register, POST /auth/login
│   │   │   ├── task.routes.ts        # CRUD /tasks (protegidas)
│   │   │   └── index.ts              # Agrupa y monta todas las rutas
│   │   └── middlewares/
│   │       ├── auth.middleware.ts    # Verifica "Authorization: Bearer <token>"
│   │       ├── validate.middleware.ts# Valida body/params con AJV + JSON Schema
│   │       └── error.middleware.ts   # Manejo de errores centralizado
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts        # Recibe req, llama al servicio, responde
│   │   └── task.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts           # Registro (bcrypt) y login (JWT)
│   │   ├── user.service.ts           # Lógica de usuarios (buscar, crear)
│   │   └── task.service.ts           # Reglas de negocio de tareas
│   │
│   ├── persistence/
│   │   ├── prisma.ts                 # Instancia única de PrismaClient (Singleton)
│   │   ├── user.repository.ts        # Consultas Prisma del modelo User
│   │   └── task.repository.ts        # Consultas Prisma del modelo Task
│   │
│   ├── schemas/                      # JSON Schemas para AJV
│   │   ├── auth.schema.ts
│   │   └── task.schema.ts
│   │
│   ├── errors/                       # Clases de error personalizadas
│   │   ├── AppError.ts               # Clase base (statusCode + message)
│   │   ├── NotFoundError.ts          # 404
│   │   ├── AuthenticationError.ts    # 401
│   │   ├── ValidationError.ts        # 400
│   │   └── ConflictError.ts          # 409 (email ya registrado)
│   │
│   ├── config/
│   │   ├── config.ts                 # Singleton que carga el .env una sola vez
│   │   └── swagger.ts                # Configuración de Swagger/OpenAPI
│   │
│   ├── types/                        # Interfaces y tipos compartidos
│   │   ├── user.types.ts
│   │   ├── task.types.ts
│   │   └── express.d.ts              # Extiende Request con req.user
│   │
│   ├── utils/                        # Helpers reutilizables
│   ├── app.ts                        # Crea y configura la app de Express
│   └── server.ts                     # Punto de entrada: arranca el servidor
│
├── prisma/
│   ├── schema.prisma                 # Modelos User y Task
│   └── migrations/                   # Migraciones versionadas (se aplican en Neon)
├── tests/                            # Pruebas con Vitest (deseable)
├── prompts/                          # Registro de prompts usados con IA
├── .env                              # Variables reales (NO se sube a git)
├── .env.example                      # Plantilla de variables (SÍ se sube)
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── DEVELOPMENT_LOG.md                # Bitácora de desarrollo (obligatoria)
└── estructura.md                     # Este archivo
```

## Responsabilidad de cada capa

| Capa | Hace | NO hace |
|------|------|---------|
| `api` | Define URLs, aplica middlewares (auth, validación) | Lógica de negocio |
| `controllers` | Lee `req`, llama al servicio, envía `res` con el código HTTP | Acceso a datos ni reglas de negocio |
| `services` | Reglas de negocio (hash, JWT); pueden usar otros services | Conocer `req`/`res` de Express |
| `persistence` | Consultas con Prisma; las de tareas filtran por `user_id` | Validar datos de entrada |

## Modelo de datos

**users**

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK, @default(uuid()) |
| nombre | VARCHAR | requerido |
| email | VARCHAR | único, guardado en minúsculas |
| password_hash | VARCHAR | hash de bcrypt, nunca texto plano |
| created_at | TIMESTAMP | |

**tasks**

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK, @default(uuid()) |
| titulo | VARCHAR | requerido |
| descripcion | TEXT | opcional |
| fecha_vencimiento | DATE | opcional, formato YYYY-MM-DD |
| estado | String + CHECK | 'pendiente', 'en curso', 'completada' (por defecto 'pendiente') |
| user_id | FK → users.id | dueño de la tarea (ON DELETE CASCADE) |
| created_at / updated_at | TIMESTAMP | |

## Endpoints

| Método | Ruta | Protegida | Descripción |
|--------|------|-----------|-------------|
| POST | /auth/register | No | Registrar usuario |
| POST | /auth/login | No | Iniciar sesión, devuelve JWT |
| POST | /tasks | Sí | Crear tarea |
| GET | /tasks | Sí | Listar mis tareas |
| GET | /tasks/:id | Sí | Ver una tarea propia |
| PUT | /tasks/:id | Sí | Editar una tarea propia |
| DELETE | /tasks/:id | Sí | Eliminar una tarea propia |
| GET | /api-docs | No | Documentación Swagger |

## Acceso a tareas de otros usuarios

Las consultas filtran por `id` **y** `user_id`. Si la tarea no existe o es de otro usuario, la
respuesta es la misma: **404 NotFoundError**. Así no se revela que existe una tarea ajena.
Por eso no hay `ForbiddenError` (403).
