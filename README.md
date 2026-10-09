# Sistema de Gestión de Tareas — API REST

API RESTful para gestionar tareas personales. Cada usuario se registra, inicia sesión y administra
**únicamente sus propias tareas**: crear, listar, consultar, editar y eliminar. La autenticación se
hace con JSON Web Tokens (JWT) y los datos se almacenan en **PostgreSQL en la nube con Neon**.

> 🚧 Proyecto en desarrollo.

---

## Stack

| Tecnología | Uso |
|------------|-----|
| Node.js | Entorno de ejecución |
| Express.js | Framework HTTP |
| TypeScript | Tipado estático |
| PostgreSQL (Neon) | Base de datos en la nube |
| pg | Cliente de PostgreSQL para Node |
| bcrypt | Hash de contraseñas |
| jsonwebtoken | Generación y verificación de JWT |
| AJV + JSON Schema | Validación de datos de entrada |
| swagger-ui-express | Documentación interactiva de la API |
| dotenv | Variables de entorno |
| Vitest | Pruebas unitarias y de integración |

## Arquitectura

Arquitectura **en capas**, cada una con una sola responsabilidad:

```
Petición HTTP
   │
   ▼
src/api           Rutas y middlewares (autenticación, validación, errores)
   │
   ▼
src/controllers   Leen la petición, llaman al servicio y responden
   │
   ▼
src/services      Lógica de negocio (bcrypt, JWT, verificar dueño de la tarea)
   │
   ▼
src/persistence   Consultas SQL
   │
   ▼
PostgreSQL (Neon)
```

Carpetas de soporte:

- `src/config` — Configuración centralizada con patrón **Singleton** (carga el `.env` una sola vez).
- `src/errors` — Clases de error personalizadas (`NotFoundError`, `AuthenticationError`, …).
- `src/schemas` — JSON Schemas para validar las peticiones.
- `src/types` — Interfaces y tipos compartidos.

Detalle completo en [estructura.md](./estructura.md).

---

## Cómo levantar el proyecto

### 1. Requisitos previos

- Node.js >= 18
- npm
- Una cuenta gratuita en [Neon](https://neon.tech)

### 2. Clonar e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd prueba-tecnica
npm install
```

### 3. Crear la base de datos en Neon

1. Entrar en [console.neon.tech](https://console.neon.tech) y crear un proyecto nuevo.
2. En el panel del proyecto, pulsar **Connect** y copiar la **connection string**. Tiene esta forma:
   ```
   postgresql://usuario:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Abrir el **SQL Editor** de Neon, pegar el contenido de `database/init.sql` y ejecutarlo para
   crear las tablas `users` y `tasks`.

### 4. Configurar el archivo .env

```bash
cp .env.example .env
```

Editar `.env` con los valores reales:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_URL` | Connection string de Neon (con `sslmode=require`) | `postgresql://...neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Clave secreta para firmar los tokens | cadena larga y aleatoria |
| `JWT_EXPIRES_IN` | Tiempo de validez del token | `1h` |

Para generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> El archivo `.env` contiene credenciales y **nunca** se sube al repositorio.

### 5. Ejecutar

```bash
npm run dev     # Desarrollo con recarga automática
npm run build   # Compila TypeScript a JavaScript (dist/)
npm start       # Ejecuta la versión compilada
npm test        # Ejecuta las pruebas con Vitest
```

El servidor queda disponible en `http://localhost:3000`.

> Neon suspende la base de datos tras unos minutos sin uso (plan gratuito). La primera petición
> después de una pausa puede tardar un poco más.

---

## Cómo se usa

### Documentación interactiva (Swagger)

Con el servidor en marcha, abrir:

```
http://localhost:3000/api-docs
```

Desde ahí se pueden probar todos los endpoints. Para las rutas protegidas, pulsar **Authorize**
y pegar el token obtenido en el login.

### Endpoints

| Método | Ruta | Protegida | Descripción |
|--------|------|-----------|-------------|
| POST | `/auth/register` | No | Registrar un usuario |
| POST | `/auth/login` | No | Iniciar sesión y obtener un JWT |
| POST | `/tasks` | Sí | Crear una tarea |
| GET | `/tasks` | Sí | Listar las tareas del usuario autenticado |
| GET | `/tasks/:id` | Sí | Consultar una tarea propia |
| PUT | `/tasks/:id` | Sí | Actualizar una tarea propia |
| DELETE | `/tasks/:id` | Sí | Eliminar una tarea propia |

### Flujo de ejemplo

**1. Registrarse**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Ana", "email": "ana@example.com", "password": "Secreta123"}'
```

**2. Iniciar sesión y obtener el token**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ana@example.com", "password": "Secreta123"}'
```

Respuesta:

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**3. Crear una tarea** (enviando el token)

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"titulo": "Estudiar TypeScript", "descripcion": "Genéricos y tipos utilitarios", "fecha_vencimiento": "2026-10-15", "estado": "pendiente"}'
```

**4. Listar mis tareas**

```bash
curl http://localhost:3000/tasks -H "Authorization: Bearer <TOKEN>"
```

### Estados de una tarea

`pendiente` · `en curso` · `completada`

### Formato de errores

Todas las respuestas de error tienen la misma forma. Los errores de validación añaden `details`
con los campos inválidos:

```json
{
  "error": {
    "name": "NotFoundError",
    "message": "Tarea no encontrada"
  }
}
```

| Código | Cuándo |
|--------|--------|
| 400 | Datos de entrada inválidos |
| 401 | Token ausente, inválido o expirado; credenciales incorrectas |
| 404 | Recurso no encontrado (también si la tarea pertenece a otro usuario) |
| 409 | Email ya registrado |
| 500 | Error interno del servidor |

---

## Documentación del proceso

- [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md) — Bitácora de desarrollo y uso crítico de IA.
- [prompts/](./prompts) — Prompts utilizados con asistentes de IA.
