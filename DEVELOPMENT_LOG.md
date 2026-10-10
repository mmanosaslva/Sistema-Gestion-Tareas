# Bitácora de desarrollo — Sistema de Gestión de Tareas

Registro del proceso: uso de IA, decisiones propias, retos y cómo se verificó cada cambio.

---

## 1. Uso de inteligencia artificial

Herramienta principal: asistente de IA con acceso al repositorio (Claude, modo agente),
durante las fases 0 a 14 descritas en [PLAN.md](./PLAN.md).
La IA escribió el código y los comandos de verificación; yo definí las reglas del proyecto
([prompts/reglas.md](./prompts/reglas.md), [prompts/restricciones.md](./prompts/restricciones.md))
y aprobé cada fase antes de continuar.

### 1.1 Ejemplo de prompt usado

> "Lee el readme, contextualizate y empieza la Fase 1, inicializar el proyecto TypeScript,
> toda la guia en plan.md, termina fase 1 y explicame que hiciste"

En cada fase posterior el prompt fue del tipo: "inicia fase N" / "sigue fase N", siempre
adjuntando o referenciando `reglas.md` y `restricciones.md` como obligatorios.

### 1.2 Cambios aceptados y por qué

| Cambio generado por IA | Por qué se aceptó |
|------------------------|--------------------|
| Arquitectura en capas (api → controllers → services → persistence) con nombres `<entidad>.<rol>.ts` | Coincide con el PDF §1 y con la estructura planeada antes de escribir código |
| Middleware único de validación AJV reutilizable (`validate(schema, parte)`) | Menos repetición que un middleware por ruta; errors de AJV van como `details` al formato de error ya definido |
| `updateMany`/`deleteMany` con `{ id, user_id }` y chequeo de `count` | Prevención de acceso a tareas ajenas; recomendado también en la lista de riesgos del plan |
| Traducción de `P2002` a `ConflictError` | Evita filtrar mensajes internos de Prisma al cliente |
| Pruebas con repositorios mockeados en memoria (`vi.mock`) | Tests rápidos y sin depender de Neon; el aislamiento entre usuarios se probó igual |

Verificación de cada aceptado: `npx tsc --noEmit`, `npm test`, y pruebas manuales contra
Neon real con `curl` (ver sección 3).

### 1.3 Cambios rechazados o modificados y por qué

| Cambio generado por IA | Qué se hizo | Motivo |
|------------------------|-------------|--------|
| Prisma 8/7 instalado por defecto (última versión) | Se cambió a **Prisma 6.19.3** | La v7 exige ESM (`"type": "module"`), driver adapters (`@prisma/adapter-pg`) y `prisma.config.ts`. El plan ya había decidido CommonJS por compatibilidad con `ajv-formats` y `tsx`. Se verificó en la documentación oficial de Prisma antes de decidir |
| `expiresIn: config.JWT_EXPIRES_IN` directo en `jwt.sign` | Se añadió un cast acotado `as jwt.SignOptions['expiresIn']` | `@types/jsonwebtoken` pide `number \| StringValue`; `Config` guarda string libre (`'1h'`). jsonwebtoken valida el formato en runtime |
| `req.params.id` usado como `string` | Se añadió `requireTaskId` con comprobación `typeof` | Express 5 tipa `params` como `string \| string[]` |
| Instalar `swagger-jsdoc` | Se rechazó; spec OpenAPI a mano en `src/config/swagger.ts` | Un solo archivo con el spec, sin comentarios `@openapi` en las rutas; una dependencia menos |
| Registro de logging con `console.log` en varios puntos | Se dejó solo el arranque del servidor y `console.error` en el middleware de errores | Restricción propia: el único log de errores va en el middleware centralizado |

### 1.4 Forma de trabajo

- Un plan por fases (`PLAN.md`); la IA escribía **solo** la fase aprobada.
- Cada fase terminaba con verificación (comando o petición real) y propuesta de mensaje
  de commit; los commits los hice yo.
- La IA nunca vio valores reales de `.env` en el chat; el `JWT_SECRET` de producción se
  generó localmente con `crypto.randomBytes(64)`.

---

## 2. Decisiones tomadas sin IA

1. **CommonJS en lugar de ESM** — decisión tomada en el análisis previo (antes de generar
   código). Motivo: evitar fricción de imports con `ajv-formats` y `tsx`, e imports sin
   extensión `.js`. La IA la respetó en todas las fases.
2. **Tarea de otro usuario responde 404, no 403** — decisión del análisis del PDF §3:
   responder 403 (o un mensaje distinto) revelaría que la tarea existe. Tratar "no existe"
   y "es de otro usuario" igual evita esa fuga de información. No existe `ForbiddenError`.
3. **`estado` como `String` + `CHECK` en la BD, no como enum de Prisma** — Prisma no admite
   espacios en valores de enum (`'en curso'`). La restricción vive en el JSON Schema (entrada)
   y en el `CHECK` añadido a mano en la migración inicial (BD).
4. **Fechas `@db.Date` con conversión UTC explícita** — decisión sobre el formato de fecha:
   entrada/salida `YYYY-MM-DD`; en el service se construye `new Date('YYYY-MM-DD')`
   (medianoche UTC) y se formatea con `toISOString().slice(0, 10)` para que no se desplace
   un día.

---

## 3. Retos y soluciones

### 3.1 Puerto 3000 ocupado por otra aplicación en el entorno

**Reto:** `curl http://localhost:3000` respondía otra app (Bidilink) del entorno de
desarrollo, no la API.

**Solución:** todas las verificaciones manuales se hicieron con `PORT=3199` en el entorno
del proceso. La app sigue escuchando 3000 por defecto vía `.env`.

### 3.2 Neon suspende la base de datos (plan gratuito)

**Reto:** la primera petición después de unos minutos sin uso tarda varios segundos
(compute de Neon escalado a cero).

**Solución:** esperar ~5s antes de las pruebas con `curl` en la terminal; en producción
no es un problema porque el compute se despierta con la primera conexión.

### 3.3 Migración con `CHECK` añadido a mano

**Reto:** el CHECK de `estado` no puede expresarse en el esquema Prisma; `prisma migrate dev`
necesita conexión a la BD.

**Solución:** se generó el SQL con `prisma migrate diff --from-empty --to-schema-datamodel`
(offline) y se añadió a mano en `prisma/migrations/20261009152431_init/migration.sql`:

```sql
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_estado_check"
  CHECK ("estado" IN ('pendiente', 'en curso', 'completada'));
```

Se verificó primero en PostgreSQL 16 local (Docker) y luego con `npm run db:deploy` en Neon:
un `INSERT` con estado inválido falla por el CHECK.

### 3.4 Errores de TypeScript con Express 5

**Reto:** `req.params.id` (`string | string[]`) y `req.body` sin tipo en controllers.

**Solución:** helpers `requireUserId` / `requireTaskId` con comprobación y lanzamiento de
`AuthenticationError` / `ValidationError`. `req.body` se castea al DTO ya validado por AJV.

### 3.5 Prisma v7 rompía el diseño CommonJS

**Reto:** instalar `prisma@latest` trajo la v7-rc, que exige ESM y driver adapters.

**Solución:** anclar `prisma@6.19.3` y `@prisma/client@6.19.3`, verificar en la documentación
oficial v6 el uso de `url`/`directUrl` en el schema. Documentado en PLAN.md.

---

## 4. Verificaciones realizadas (resumen)

| Fase | Verificación |
|------|--------------|
| 1 | `tsc --noEmit` sin errores; `npm run dev` arranca |
| 2 | Sin `.env` o sin `JWT_SECRET` la app no arranca y lanza mensaje claro; con `.env` arranca |
| 3 | Migración aplicada en Neon; tablas `users`/`tasks` y CHECK visibles; `INSERT` inválido rechazado; `$connect` al arrancar |
| 4 | `GET /no-existe` → 404 con `{ "error": { "name", "message" } }` |
| 5 | 13 casos de schemas (email inválido, password corta, campos extra, fecha, uuid, PUT vacío/parcial) |
| 6 | Registro 201 sin `password_hash`; email normalizado; duplicado 409; email inválido 400 con `details`; hash `$2b$` en BD |
| 7 | Login devuelve `{ token }`; payload solo `sub/iat/exp`; password mala e email inexistente → mismo 401 |
| 8 | Middleware: sin cabecera, mal formada, basura, expirado, HS384, sin `sub` → 401; token válido deja `req.user` |
| 9 | POST 201 con `pendiente` por defecto; fecha sin desfase; GET solo tareas propias (2 usuarios); 401 sin token |
| 10 | Usuario B sobre tarea de A → 404 en GET/PUT/DELETE; PUT `{}` → 400; PUT parcial → 200; DELETE → 204 |
| 11 | `/api-docs` carga; spec con los 7 endpoints y `bearerAuth`; flujo login → Authorize → GET /tasks |
| 12 | README seguido de cero: `db:deploy` idempotente, build, arranque, registro 201 |
| 13 | `npm test`: 22 pruebas en 4 archivos (unitarias de services/middleware + integración de aislamiento), todas pasan |

---

## 5. Pendientes

- **Video:** arquitectura, demo en Swagger y defensa de decisiones (grabación propia).
- **Despliegue opcional en Render:** no realizado; el PDF lo marca como opcional.
