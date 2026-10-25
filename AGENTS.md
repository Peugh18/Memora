<!-- proyecto-maestro:start -->
# Instrucciones para agentes (Claude, GPT, Gemini, Codex, Antigravity…)

Este proyecto tiene memoria compartida en `docs/ai/`. Antes de cualquier tarea:

1. Lee `docs/ai/PROYECTO.md` (prompt maestro: qué es, arquitectura, diseño, comandos y reglas).
2. Lee `docs/ai/PLAN.md` (estado actual, fases y siguiente paso).
3. Lee las últimas entradas de `docs/ai/BITACORA.md`.
4. Para pantallas: el diseño aprobado está en `diseno/vistas/*.dc.html` y lo que hace cada botón en `docs/app-botones.md`. Cópialos fielmente.

Al terminar una tarea, actualiza `docs/ai/PLAN.md` y agrega una entrada en `docs/ai/BITACORA.md`.

Reglas: responder en español; planear antes de las tareas no triviales; no hacer commit ni push sin pedirlo; no agregar dependencias sin avisar; mostrar evidencia (pruebas) antes de decir que algo está listo.

Comando de verificación: `cd servidor && php artisan test`
<!-- proyecto-maestro:end -->
