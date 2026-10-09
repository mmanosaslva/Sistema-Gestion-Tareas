# Prompts

Prompts usados con asistentes de IA durante el desarrollo. Sirven como fuente para la sección
"Uso de Asistentes de IA" de `DEVELOPMENT_LOG.md`.

## Archivos

| Archivo | Propósito |
|---------|-----------|
| [organizacion.md](./organizacion.md) | Primer prompt: orquesta fases, orden de trabajo y commits |
| [reglas.md](./reglas.md) | Lo que el código debe cumplir obligatoriamente |
| [restricciones.md](./restricciones.md) | Lo que está prohibido |
| [001-analisis-prueba.md](./001-analisis-prueba.md) | Historial: análisis inicial de la prueba |

`reglas.md` y `restricciones.md` se referencian en cada prompt que crea o modifica archivos.

## Plantilla para nuevos prompts

```markdown
# NNN — Tema

**Fecha:** AAAA-MM-DD
**Herramienta:** (Claude Code, ChatGPT, Copilot…)

## Prompt
> (texto exacto)

## Qué se aceptó y por qué

## Qué se rechazó o modificó y por qué

## Verificación realizada
```
