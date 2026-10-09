# Plan de Desarrollo

Plan por fases generado a partir de [prompts/organizacion.md](./prompts/organizacion.md),
respetando [prompts/reglas.md](./prompts/reglas.md) y [prompts/restricciones.md](./prompts/restricciones.md).

Cada fase termina con: verificación manual + commit (Conventional Commits, descripción en español) + entrada en la bitácora.

## Calendario

| Fecha | Trabajo |
|-------|---------|
| 08/10 | Análisis de la prueba, estructura, README y prompts (hecho) |
| 09/10 | Fases 0 a 10: base del proyecto, autenticación y CRUD de tareas |
| 10/10 | Fases 11 a 14: Swagger, JSDoc, tests, bitácora y video (y lo que quede del 09/10) |

## Decisiones tomadas

- **Módulos:** CommonJS (`"module": "commonjs"` en tsconfig). Menos problemas de compatibilidad
  con `pg`, `ajv-formats` y `tsx`; imports sin extensión `.js`.
- **Base de datos:** PostgreSQL en Neon, driver `pg` con SQL directo, ids UUID.
- **Tareas ajenas:** 404 (no se revela su existencia).

## Decisiones pendientes

- **Swagger (fase 11):** `swagger-jsdoc` con comentarios `@openapi` en las rutas, o un objeto
  OpenAPI tipado en `src/config/swagger.ts`.

---

## Fases

### [ ] Fase 0 — Repositorio y documentación base
- `git init`, crear repositorio en GitHub, subir documentación existente.
- `PRUEBA_TECNICA.pdf` fuera del repositorio (`.gitignore`).
- **Verificar:** el repositorio en GitHub muestra README, estructura.md, PLAN.md y prompts/.
- **Commit:** `docs: agregar estructura del proyecto, plan, readme y prompts de IA`

### [ ] Fase 1 — Inicializar proyecto TypeScript
- **Archivos:** `package.json`, `tsconfig.json` (strict, commonjs), `.gitignore`, `.env.example`,
  `src/app.ts`, `src/server.ts`.
- **Dependencias:** `express@5`, `dotenv`; dev: `typescript`, `tsx`, `@types/node`, `@types/express`.
- **Scripts:** `dev` (tsx watch), `build` (tsc), `start` (node dist/server.js), `test` (vitest).
- **Verificar:** `npx tsc --noEmit` sin errores; `npm run dev` arranca en el puerto 3000.
- **Commit:** `chore: inicializar proyecto express con typescript`

### [ ] Fase 2 — Config Singleton
- **Archivos:** `src/config/config.ts`.
- **Verificar:** sin `JWT_SECRET` la app no arranca y muestra un mensaje claro; con él, arranca.
- **Commit:** `feat: agregar configuración singleton con validación de variables de entorno`

### [ ] Fase 3 — Base de datos en Neon
- **Archivos:** `database/init.sql`, `src/persistence/database.ts` (Pool único).
- **Dependencias:** `pg`, `@types/pg`.
- **Verificar:** `init.sql` ejecutado en el SQL Editor de Neon; el servidor hace `SELECT 1` al
  arrancar y no levanta si la conexión falla.
- **Commit:** `feat: agregar conexión a postgres y esquema de base de datos`

### [ ] Fase 4 — Errores centralizados
- **Archivos:** `src/errors/` (AppError, ValidationError, AuthenticationError, NotFoundError,
  ConflictError), `src/api/middlewares/error.middleware.ts`, manejador de rutas inexistentes.
- **Verificar:** `GET /no-existe` → 404 con `{ "error": { "name", "message" } }`.
- **Commit:** `feat: agregar errores personalizados y manejador de errores centralizado`

### [ ] Fase 5 — Validación con AJV
- **Archivos:** `src/api/middlewares/validate.middleware.ts`, `src/schemas/auth.schema.ts`,
  `src/schemas/task.schema.ts`.
- **Dependencias:** `ajv`, `ajv-formats`.
- **Verificar:** en la fase 6, email inválido → 400 con `details`.
- **Commit:** `feat: agregar middleware de validación con ajv y esquemas`

### [ ] Fase 6 — Usuarios y registro
- **Archivos:** `src/types/user.types.ts`, `src/persistence/user.repository.ts`,
  `src/services/user.service.ts`, `src/services/auth.service.ts`,
  `src/controllers/auth.controller.ts`, `src/api/routes/auth.routes.ts`.
- **Dependencias:** `bcrypt`, `@types/bcrypt`.
- **Verificar:** registro → 201 sin `password_hash`; email repetido → 409; email inválido → 400;
  en Neon la columna guarda un hash `$2b$...`.
- **Commit:** `feat: agregar endpoint de registro de usuarios`

### [ ] Fase 7 — Login con JWT
- **Dependencias:** `jsonwebtoken`, `@types/jsonwebtoken`.
- **Verificar:** login correcto → `{ token }` con payload solo `sub`, `iat`, `exp` (jwt.io);
  email inexistente y contraseña incorrecta → mismo 401.
- **Commit:** `feat: agregar endpoint de login con jwt`

### [ ] Fase 8 — Middleware de autenticación
- **Archivos:** `src/api/middlewares/auth.middleware.ts`, `src/types/express.d.ts`.
- **Verificar (en fase 9):** sin cabecera, `Bearer xxx` o token expirado → 401.
- **Commit:** `feat: agregar middleware de autenticación jwt`

### [ ] Fase 9 — Tareas: crear y listar
- **Archivos:** `src/types/task.types.ts`, `src/persistence/task.repository.ts`,
  `src/services/task.service.ts`, `src/controllers/task.controller.ts`, `src/api/routes/task.routes.ts`.
- **Verificar:** `POST /tasks` → 201 con estado `pendiente` por defecto; `GET /tasks` con 2 usuarios
  solo devuelve las tareas propias.
- **Commit:** `feat: agregar endpoints para crear y listar tareas`

### [ ] Fase 10 — Tareas: consultar, editar y eliminar
- **Verificar:** usuario B sobre tarea de A → 404 en GET, PUT y DELETE; PUT `{}` → 400;
  PUT parcial → 200; DELETE → 204.
- **Commit:** `feat: agregar endpoints para consultar, actualizar y eliminar tareas`

### [ ] Fase 11 — Swagger
- **Dependencias:** `swagger-ui-express` (+ `swagger-jsdoc` según decisión) y sus `@types`.
- **Verificar:** `/api-docs` carga, Authorize funciona, los 7 endpoints se prueban desde la UI.
- **Commit:** `docs: agregar documentación swagger de todos los endpoints`

### [ ] Fase 12 — JSDoc y README final
- **Verificar:** seguir el README desde cero como si fuera el evaluador.
- **Commit:** `docs: agregar jsdoc y completar readme`

### [ ] Fase 13 — Pruebas (deseable)
- **Dependencias:** `vitest`, `supertest`, `@types/supertest`.
- **Alcance:** unitarias de `auth.service` y `task.service` (repositorio mockeado), middleware de
  autenticación, integración del aislamiento entre usuarios.
- **Commit:** `test: agregar pruebas unitarias y de integración`

### [ ] Fase 14 — Bitácora, video y despliegue
- `DEVELOPMENT_LOG.md`: uso de IA, al menos 2 decisiones sin IA, retos y soluciones.
- Despliegue opcional (Render).
- Video: arquitectura, demo en Swagger, defensa de decisiones.
- **Commit:** `docs: agregar bitácora de desarrollo`

---

## Puntos de riesgo en código generado por IA

1. **UPDATE parcial dinámico:** construir `SET` desde las claves del body permite inyección por
   nombre de columna. Lista blanca de columnas y `WHERE id = $1 AND user_id = $2`.
2. **DELETE/UPDATE sin `user_id`:** verificar que todas las consultas filtran por dueño.
3. **Fechas en `pg`:** `DATE` se convierte a `Date` con zona horaria y puede desplazarse un día.
   Configurar el type parser 1082 para devolver string.
4. **`jwt.verify`:** indicar `{ algorithms: ['HS256'] }`; el payload es `string | JwtPayload`,
   comprobar el tipo en vez de hacer cast.
5. **Express 5:** sintaxis de comodines distinta a Express 4; el middleware de errores necesita
   4 parámetros.
6. **`express.d.ts`:** si tsconfig no lo incluye, `req.user` falla y la tentación es usar `any`.
7. **`ajv-formats` + TypeScript:** problemas de import por default export; modo strict de AJV.
8. **`bcrypt` en WSL:** módulo nativo, puede fallar al compilar; alternativa `bcryptjs`.
9. **SSL de Neon:** avisos de `sslmode` en versiones recientes de `pg`; no desactivar la
   verificación del certificado.
