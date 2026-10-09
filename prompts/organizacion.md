# Prompt 01 — Organización del trabajo

> Primer prompt del proyecto. Su objetivo es orquestar la estructura del trabajo: definir fases,
> orden de implementación y commits antes de escribir código.

---

## Prompt

```
Actúa como un desarrollador backend senior que me guía en una prueba técnica para un puesto de
aprendiz/practicante backend. Quiero entender cada decisión, no solo recibir código.

## Contexto
Debo construir una API RESTful de gestión de tareas con Node.js + Express + TypeScript y
PostgreSQL alojado en Neon (cloud). Los usuarios se registran, inician sesión con JWT y gestionan
únicamente sus propias tareas. Plazo: 4 días.

Antes de responder, lee y respeta:
- prompts/reglas.md        (lo que es obligatorio)
- prompts/restricciones.md (lo que está prohibido)
- estructura.md            (arquitectura en capas y modelo de datos)

## Requisitos funcionales
1. POST /auth/register: nombre, email, contraseña (hash con bcrypt).
2. POST /auth/login: verifica credenciales y devuelve un JWT.
3. Middleware que lee "Authorization: Bearer <token>" y protege las rutas.
4. CRUD de tareas (id, titulo, descripcion, fecha_vencimiento, estado: 'pendiente' | 'en curso' |
   'completada'), cada tarea asociada a su usuario:
   POST /tasks, GET /tasks, GET /tasks/:id, PUT /tasks/:id, DELETE /tasks/:id.
   Solo el dueño puede ver, modificar o eliminar una tarea.
5. Validación de entradas con AJV + JSON Schema.
6. Errores centralizados con clases personalizadas y respuestas JSON consistentes.
7. Swagger para todos los endpoints y JSDoc en funciones y clases importantes.
8. Configuración con .env, .env.example y una clase Config con patrón Singleton.

## Lo que necesito de ti
1. Un plan dividido en fases pequeñas y ordenadas, desde la inicialización del proyecto hasta la
   entrega (README, DEVELOPMENT_LOG.md, video).
2. Para cada fase:
   - Objetivo y archivos que se crean o modifican.
   - Dependencias npm necesarias y por qué cada una.
   - Cómo verifico que la fase funciona antes de seguir.
   - El mensaje de commit siguiendo Conventional Commits (feat:, fix:, chore:, docs:, test:,
     refactor:), con la descripción en español.
3. Una distribución sugerida de las fases en los 4 días, dejando margen para documentación,
   pruebas con Vitest y el video.
4. Los puntos donde es más probable que el código generado por IA tenga errores (seguridad,
   tipado, lógica de permisos) para revisarlos con más cuidado.

No escribas código todavía. Solo el plan. Avanzaremos fase por fase y yo confirmaré cada una
antes de pasar a la siguiente.
```

---

## Registro (para DEVELOPMENT_LOG.md)

**Fecha de uso:**

**Qué se aceptó y por qué:**

**Qué se rechazó o modificó y por qué:**

**Verificación realizada:**
