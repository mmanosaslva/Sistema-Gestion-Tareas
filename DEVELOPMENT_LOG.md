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

### 1.5 Revisión final: errores encontrados en el código generado

Con todas las fases terminadas, se pidió a la IA revisar los commits y probar la API completa.

**Prompts usados:**

> "todo listo y terminado, puedes leer los commits y probar el codigo!"

> "explicame, no entiendo el error, que propones? para cada problema escribe primero un test que demuestra el error, justificalo, explica tu plan, si te doy aval lo ejecutas y demuestras que el test pasa"

**Cómo se revisó:** lectura de todo `src/` contra `prompts/reglas.md` y
`prompts/restricciones.md`, `tsc --noEmit`, `npm test`, y 27 peticiones `curl` contra el
servidor compilado conectado a Neon.

**Método de corrección:** para cada problema se escribió primero un test que lo demuestra
(falla con el código original), después se aplicó el arreglo y se comprobó que el test pasa.
Resultado antes del arreglo: `6 failed | 22 passed (28)`. Después: `28 passed (28)`.

| # | Problema encontrado | Evidencia antes del arreglo | Arreglo | Verificación después |
|---|---------------------|-----------------------------|---------|----------------------|
| 1 | Un cuerpo JSON mal formado (`{"email":`) respondía **500 "Error interno del servidor"**. `express.json()` lanza su propio error (`type: 'entity.parse.failed'`) antes de AJV y el `errorHandler` solo reconocía `AppError`. El fallo es del cliente, debe ser 400 | `curl` contra Neon → `[500]`. Test `JSON mal formado responde 400`: `expected 400 "Bad Request", got 500` | `isJsonParseError` en `error.middleware.ts` convierte ese error en `ValidationError` | `curl` → `[400] {"name":"ValidationError","message":"El cuerpo de la petición no es un JSON válido"}`; test pasa |
| 2 | `user.service.ts` importaba `Prisma` de `@prisma/client` para traducir `P2002`. Incumplía la restricción 12 (Prisma solo en `src/persistence`) | `grep "@prisma/client" src/` mostraba `services/user.service.ts`. Test `traduce P2002 ... en la capa de persistencia`: `expected PrismaClientKnownRequestError to be an instance of ConflictError` | La traducción `P2002 → ConflictError` se movió a `user.repository.ts`; el service ya no conoce Prisma | `grep` solo encuentra `persistence/`; test pasa; registro duplicado contra Neon sigue dando `[409]` |
| 3 | Un `titulo` o `nombre` de solo espacios (`"   "`) se aceptaba: `minLength: 1` cuenta los espacios. Incumplía la regla 7.3 ("no vacíos") | `curl` contra Neon → `[201]` con `"titulo":"   "`. 3 tests (`titulo`/`nombre` solo espacios) fallaban | `pattern: '\\S'` (al menos un carácter no blanco) en los schemas AJV y en Swagger | Tests pasan; `curl` con `nombre: "   "` → `[400]` |
| 4 | `normalizeEmail` hacía `trim()`, pero AJV (`format: "email"`) rechaza antes los emails con espacios: código inalcanzable. El test unitario lo "probaba" llamando al service sin pasar por AJV | `curl` con `"  QA.A...@EXAMPLE.COM "` → `[400]` de AJV, nunca llegaba al `trim()` | `normalizeEmail` queda en `toLowerCase()`; el test usa un email sin espacios (caso real) | Email en mayúsculas sigue detectándose como duplicado (`[409]`) y el login en mayúsculas funciona (`[200]`) |
| 5 | Diferencia de tiempos en el login: si el email no existía no se ejecutaba `bcrypt.compare` y la respuesta era más rápida. Midiendo el tiempo se podía saber qué emails están registrados, aunque el mensaje fuera el mismo | Test `email inexistente también ejecuta bcrypt.compare`: `expected "compare" to be called 1 times, but got 0 times` | Se compara siempre: contra el hash real o contra `DUMMY_PASSWORD_HASH` | Test pasa; `curl` contra Neon: email existente `0.204s`, inexistente `0.186s`, ambos `[401]` |

**Qué aprendí de esta revisión:** los tests que escribió la IA pasaban, pero no cubrían estos
casos (el test del `trim()` incluso probaba un camino imposible). Un test verde no garantiza
que el comportamiento sea correcto: hay que probar también contra la API real y contra las
reglas del proyecto.

---

## 2. Decisiones tomadas sin IA

1. **PostgreSQL en Neon (en la nube) en vez de una base local** — desde el principio quise
   tener la base de datos en la nube y le pregunté a la IA si era válido usar Neon o si tenía
   que ser PostgreSQL local. El PDF solo pide PostgreSQL, y Neon es PostgreSQL. Lo escogí
   porque no tengo que instalar ni mantener Postgres en mi máquina (WSL), los datos quedan
   guardados aunque cambie de equipo y, si hago el despliegue, la base ya está lista en la
   nube. 

2. **Prisma** — decisión sobre las consultas: escogí Prisma, como ORM, antes que `pg`, el
   driver nativo de PostgreSQL para Node.js, con el que puedo hacer las consultas SQL puras
   directamente. Primeramente por comodidad, prefiero el mapeo objeto-relacional. La IA me
   recomendó `pg` con SQL directo y yo elegí Prisma igualmente; a cambio tuve que cuidar
   que todas las consultas de tareas filtren por `user_id`.

3. **Reglas y restricciones basadas en el PDF y sin contradicciones** — antes de escribir
   código, la IA generó `reglas.md` y `restricciones.md` mezclando lo que pide la prueba con
   decisiones suyas, y algunas chocaban entre sí. Le pedí que no dejara que chocaran y que las
   rehiciera analizando primero el PDF. Desde entonces cada regla indica su origen
   (`[PDF §n]` o `[Decisión]`) y cada restricción dice qué regla protege. Gracias a eso se
   detectó el choque entre 403 y 404: una regla decía que una tarea ajena responde 403, pero
   otra obligaba a filtrar las consultas por `user_id`, lo que en la práctica da 404. Se
   quedó una sola respuesta (404) en todos los documentos.

### 2.1 Decisiones que propuso la IA y que evalué antes de aceptarlas

Estas no salieron de mí, pero las revisé y puedo defenderlas:

1. **CommonJS en lugar de ESM** — menos problemas de imports con `ajv-formats` y `tsx`, e
   imports sin extensión `.js`. Lo comprobé cuando Prisma 7 pedía ESM: preferí bajar a
   Prisma 6 antes que cambiar todo el proyecto a ESM.
2. **Tarea de otro usuario responde 404, no 403** — responder 403 confirmaría que la tarea
   existe. Tratar "no existe" y "es de otro usuario" igual evita esa fuga de información.
   Por eso no existe `ForbiddenError`.
3. **`estado` como `String` + `CHECK` en la BD, no como enum de Prisma** — Prisma no admite
   espacios en valores de enum (`'en curso'`). La restricción vive en el JSON Schema
   (entrada) y en el `CHECK` añadido a mano en la migración inicial (BD); lo probé
   insertando un estado inválido.
4. **Fechas `@db.Date` con conversión UTC explícita** — entrada y salida `YYYY-MM-DD`; en el
   service se construye `new Date('YYYY-MM-DD')` (medianoche UTC) y se formatea con
   `toISOString().slice(0, 10)` para que la fecha no se desplace un día.
   Por qué pasa: PostgreSQL guarda solo la fecha, Prisma la devuelve como `Date` a las
   00:00 UTC y, si se formatea con la hora local (por ejemplo UTC-5), sale el día anterior.
   Lo comprobé con el test `formatea fecha @db.Date (medianoche UTC) como YYYY-MM-DD sin
   desplazar día` y creando una tarea con `2026-10-15` contra Neon: se devuelve `2026-10-15`.

---

## 3. Retos y soluciones

### 3.1 Puerto 3000 ocupado por otra aplicación en el entorno

**Reto:** `curl http://localhost:3000` respondía otra app del entorno de
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
| Revisión final | 5 problemas corregidos (sección 1.5); `npm test`: 28 pruebas en 6 archivos, todas pasan; `curl` contra Neon confirma cada arreglo |

---

## 5. Pendientes

- **Video:** arquitectura, demo en Swagger y defensa de decisiones (grabación propia).
- **Despliegue opcional en Render:** no realizado; el PDF lo marca como opcional.
