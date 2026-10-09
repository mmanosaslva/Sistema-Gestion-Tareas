# Prompt — Restricciones (prohibido)

> Se adjunta o se referencia en cada prompt que genere o modifique archivos.
> Define lo que el código **no debe** hacer nunca.
>
> Cada restricción indica la regla de `reglas.md` que protege, para que ambos archivos no se
> contradigan. Si una restricción y una regla parecen chocar, manda `reglas.md` y se corrige
> este archivo.

---

## Prompt

```
Al crear o modificar cualquier archivo de este proyecto, está PROHIBIDO:

## Seguridad
1. Guardar, devolver o loguear contraseñas en texto plano.                          (regla 5.1)
2. Incluir password_hash en cualquier respuesta, log o token.                        (reglas 5.5, 8.4)
3. Escribir credenciales, DATABASE_URL o JWT_SECRET en el código o en archivos
   versionados; subir el archivo .env.                                               (reglas 3.1, 12.2)
4. Usar $queryRawUnsafe / $executeRawUnsafe, o construir SQL concatenando datos del
   usuario. Si hace falta SQL raw, solo $queryRaw con tagged template.                (regla 1.2)
5. Validar tokens con jwt.decode(); se usa jwt.verify() indicando el algoritmo HS256. (reglas 5.5, 5.6)
6. Indicar en el login si el email existe o si falló la contraseña.                  (regla 5.4)
7. Enviar al cliente stack traces, mensajes internos de la base de datos o errores
   originales de Prisma.                                                             (reglas 8.4, 8.5)

## Autorización
8. Consultar, modificar o eliminar tareas sin user_id en el where de Prisma.        (regla 6.3)
9. Tomar el user_id del body, query o params; solo sale de req.user.                 (reglas 5.7, 6.2)
10. Responder 403 o un mensaje distinto cuando la tarea es de otro usuario; se
    responde igual que si no existiera (404).                                         (regla 6.4)

## Arquitectura
11. Poner lógica de negocio en rutas o controllers.                                   (regla 2.1)
12. Importar PrismaClient o el cliente de Prisma fuera de src/persistence.          (regla 2.1)
13. Usar req/res de Express dentro de services o persistence.                         (regla 2.1)
14. Que una capa llame a una capa superior (ej. persistence que importe un service).  (regla 2.3)
15. Leer process.env fuera de la clase Config.                                        (regla 3.2)
16. Crear más de una instancia de PrismaClient.                                     (regla 4.8)
17. Pasar req.body (o cualquier objeto de entrada) directamente a data de Prisma;
    se copian solo los campos permitidos (evita asignar user_id o id desde fuera).   (regla 6.6)

## Errores
18. Responder errores con res.status().json() en controllers, services o middlewares
    que no sean el de errores; se lanza un AppError y lo responde el middleware
    centralizado.                                                                     (regla 8.2)
19. Lanzar new Error() genérico para casos conocidos; se usa la clase AppError que
    corresponda.                                                                      (regla 8.1)

## TypeScript y código
20. Usar `any`; se usa `unknown` y se acota el tipo.                                  (regla 10.3)
21. Usar `// @ts-ignore`, `// @ts-nocheck` o desactivar strict.                       (regla 10.2)
22. Dejar console.log de depuración, código comentado o TODOs sin resolver.
    (console.error solo dentro del middleware de errores.)                            (regla 8.4)

## Alcance
23. Usar otro ORM o query builder además de Prisma (TypeORM, Sequelize, Knex).       (regla 1.2)
24. Modificar la base de datos con prisma db push o a mano en Neon; solo migraciones.  (regla 4.6)
25. Añadir funcionalidades que el PDF no pide (CRUD de usuarios, roles, refresh tokens,
    frontend, paginación, filtros) sin consultarlo antes. Pruebas y despliegue sí
    están permitidos porque son deseables del PDF.                                    (regla 13.1)
26. Añadir dependencias sin explicar para qué sirven y por qué son necesarias.        (regla 14.1)
27. Cambiar la estructura de carpetas de estructura.md sin consultarlo antes.         (regla 2.1)

## Forma de trabajar
28. Escribir código de varias fases a la vez.                                         (regla 14.4)
29. Afirmar que algo funciona sin haberlo probado; si no se ha probado, decirlo.      (regla 14.3)
30. Hacer commits o push sin que yo lo pida; solo proponer el mensaje.                (regla 12.1)
```
