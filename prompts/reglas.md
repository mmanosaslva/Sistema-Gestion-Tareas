# Prompt — Reglas (obligatorio)

> Se adjunta o se referencia en cada prompt que genere o modifique archivos.
> Define lo que el código **debe** cumplir siempre.
>
> Cada regla indica su origen:
> - **[PDF §n]** — exigido por la prueba técnica (sección n del documento).
> - **[Decisión]** — elegido por nosotros donde el PDF no especifica; la justificación va entre paréntesis.
>
> Este archivo y `restricciones.md` no se contradicen: cada restricción es el reverso de una regla.

---

## Prompt

```
Al crear o modificar cualquier archivo de este proyecto, cumple OBLIGATORIAMENTE estas reglas.

## 1. Stack
1.1 [PDF] Node.js + Express + TypeScript + PostgreSQL.
1.2 [Decisión] PostgreSQL alojado en Neon, conexión con el driver `pg` y SQL directo
    (control total de las consultas y fácil de explicar en la defensa).
1.3 [Decisión] Express 5 (captura automáticamente los errores de los handlers async y los
    envía al middleware de errores, sin wrappers).

## 2. Arquitectura en capas
2.1 [PDF §1] Respeta estas carpetas y responsabilidades:
    - src/api: rutas (routes) y middlewares.
    - src/controllers: leen req, llaman al servicio y responden con res.
    - src/services: lógica de negocio y reutilizable.
    - src/persistence: comunicación con la base de datos.
2.2 [PDF §1] Se permiten carpetas adicionales: config, errors, schemas, types, utils.
2.3 [Decisión] Flujo de llamadas: api → controllers → services → persistence.
    Un service puede usar otro service (ej. auth.service usa user.service).
    Ninguna capa llama a una capa superior.
2.4 [Decisión] Nombres de archivo <entidad>.<rol>.ts:
    auth.routes.ts, task.controller.ts, task.service.ts, task.repository.ts, auth.middleware.ts.
    Clases de error y config usan el nombre de la clase (NotFoundError.ts, config.ts).

## 3. Configuración
3.1 [PDF §1] Variables de entorno en .env; el repositorio incluye .env.example con todas las
    variables y valores de ejemplo (nunca reales).
3.2 [PDF §1] Una clase Config con patrón Singleton carga las variables una sola vez y las
    expone al resto de la aplicación.
3.3 [Decisión] Config valida al arrancar que existan DATABASE_URL y JWT_SECRET; si falta alguna,
    la aplicación no arranca y muestra un mensaje claro (falla rápido, no en la primera petición).
3.4 [Decisión] Variables: PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN.

## 4. Base de datos
4.1 [PDF §3] Tabla tasks con: id, titulo, descripcion, fecha_vencimiento, estado y user_id
    (FK a users.id). Cada tarea pertenece al usuario que la creó.
4.2 [PDF §2] Tabla users con: id, nombre, email (único), password_hash.
4.3 [Decisión] Ids de tipo UUID generados con gen_random_uuid()
    (no son secuenciales: no se pueden adivinar ids de otros usuarios).
4.4 [PDF §3] estado restringido a 'pendiente' | 'en curso' | 'completada'
    (CHECK en la base de datos y enum en el JSON Schema).
4.5 [Decisión] estado por defecto 'pendiente'; created_at y updated_at automáticos;
    ON DELETE CASCADE en tasks.user_id.
4.6 [Decisión] Script de creación en database/init.sql, ejecutable en el SQL Editor de Neon.
4.7 [Decisión] Un único Pool de pg reutilizado en toda la app, con DATABASE_URL y SSL.
4.8 [Decisión] Consultas SQL siempre parametrizadas ($1, $2, ...).

## 5. Autenticación y autorización
5.1 [PDF §2] POST /auth/register recibe nombre, email y password; guarda la contraseña con bcrypt.
5.2 [Decisión] bcrypt con 10 salt rounds; email normalizado (trim + minúsculas) antes de guardar
    y buscar. Email ya registrado → ConflictError (409).
5.3 [PDF §2] POST /auth/login verifica credenciales y devuelve un JWT: { "token": "<jwt>" }.
5.4 [Decisión] Credenciales incorrectas → AuthenticationError (401) con el mismo mensaje genérico
    tanto si el email no existe como si la contraseña es incorrecta.
5.5 [Decisión] El JWT se firma con JWT_SECRET, algoritmo HS256, expiración JWT_EXPIRES_IN,
    y su payload contiene solo el id del usuario (claim sub).
5.6 [PDF §2] Un middleware lee "Authorization: Bearer <token>", verifica el token y, si es válido,
    deja pasar la petición. Cabecera ausente, mal formada, token inválido o expirado →
    AuthenticationError (401).
5.7 [Decisión] El middleware guarda el id del usuario en req.user (tipado extendiendo Request
    en src/types/express.d.ts).

## 6. Tareas (CRUD)
6.1 [PDF §3] Endpoints protegidos: POST /tasks, GET /tasks, GET /tasks/:id, PUT /tasks/:id,
    DELETE /tasks/:id.
6.2 [PDF §3] El user_id de una tarea es siempre el del usuario autenticado (req.user).
6.3 [PDF §3] Solo el dueño accede a su tarea. Toda consulta de tareas filtra por user_id en el
    SQL (WHERE id = $1 AND user_id = $2).
6.4 [Decisión] Si la tarea no existe o pertenece a otro usuario → NotFoundError (404).
    Se trata igual a propósito: no se revela que existe una tarea ajena. Por eso no existe
    ForbiddenError ni código 403 para tareas.
6.5 [Decisión] Al crear: titulo obligatorio; descripcion, fecha_vencimiento y estado opcionales.
6.6 [Decisión] PUT /tasks/:id acepta actualización parcial: cualquier subconjunto de titulo,
    descripcion, fecha_vencimiento y estado, con al menos un campo.
6.7 [Decisión] fecha_vencimiento en formato ISO "YYYY-MM-DD".
6.8 [Decisión] GET /tasks devuelve un array (vacío si no hay tareas).

## 7. Validación
7.1 [PDF §4] Todo body y parámetro de entrada se valida con AJV + JSON Schema antes de llegar al
    controller, mediante un middleware de validación.
7.2 [PDF §4] Email con formato válido (ajv-formats, format "email").
7.3 [Decisión] Validaciones adicionales: password mínimo 8 caracteres; nombre y titulo no vacíos;
    :id con formato uuid; additionalProperties: false en todos los schemas.

## 8. Manejo de errores
8.1 [PDF §4] Clases de error personalizadas que extienden una clase base AppError con statusCode:
    ValidationError (400), AuthenticationError (401), NotFoundError (404), ConflictError (409).
8.2 [PDF §4] Un único middleware de errores centralizado construye todas las respuestas de error
    con este formato:
    { "error": { "name": string, "message": string, "details"?: array } }
    details solo aparece en errores de validación (lista de campos inválidos).
8.3 [Decisión] Rutas inexistentes → NotFoundError (404) con el mismo formato.
8.4 [Decisión] Errores no controlados → 500 con mensaje genérico; el detalle se registra en el
    servidor con console.error dentro del middleware de errores (único lugar donde se loguea).

## 9. Códigos HTTP
9.1 [Decisión] 201 crear · 200 consultar/actualizar · 204 eliminar ·
    400 validación · 401 autenticación · 404 no encontrado · 409 email duplicado · 500 interno.

## 10. TypeScript y calidad
10.1 [PDF §5] Código legible siguiendo buenas prácticas de TypeScript.
10.2 [Decisión] "strict": true en tsconfig.json.
10.3 [Decisión] Tipos explícitos en parámetros y retornos de funciones públicas; interfaces de
     entidades (User, Task) y DTOs de entrada en src/types.

## 11. Documentación
11.1 [PDF §5] Swagger documenta todos los endpoints (body, respuestas y errores), servido en
     /api-docs, con esquema de seguridad Bearer.
11.2 [PDF §5] JSDoc en clases, servicios, middlewares y funciones importantes.
11.3 [PDF Entregables] README.md con: descripción y arquitectura, instalación (npm install),
     configuración del .env y comandos (npm run dev).
11.4 [PDF Entregables] DEVELOPMENT_LOG.md con: uso de IA (prompt exacto, qué se aceptó y por qué,
     qué se rechazó o modificó y por qué, verificación realizada), al menos 2 decisiones tomadas
     sin IA, y retos y soluciones.

## 12. Git
12.1 [PDF §5] Conventional Commits, atómicos y descriptivos (feat:, fix:, docs:, chore:, test:,
     refactor:). Al terminar cada cambio, propón el mensaje de commit.
12.3 [Decisión] El tipo del commit va en inglés (estándar de Conventional Commits) y la
     descripción en español, en minúsculas e infinitivo.
     Ej.: "feat: agregar endpoint de login con jwt".
12.2 [Decisión] .gitignore incluye node_modules, dist y .env.

## 13. Pruebas (deseable)
13.1 [PDF Deseables] Pruebas con Vitest, empezando por services y middlewares críticos
     (auth, validación, propiedad de tareas).

## 14. Forma de trabajar con la IA
14.1 [PDF Bitácora] Explica qué hace el código generado y por qué se eligió esa solución.
14.2 [PDF Criterio 6] Señala las partes que debo revisar con más cuidado.
14.3 [PDF Bitácora] Indica cómo verificar el cambio (comando, petición de ejemplo o test).
14.4 [Decisión] El plan completo puede mostrarse de una vez, pero el código se escribe fase por
     fase y espero mi confirmación antes de continuar.
```
