# Diagnóstico técnico de PresuObra

## Qué no cuadra hoy

1. **Monorepo declarado vs estructura real**
   - El `package.json` raíz declara workspaces `packages/frontend` y `packages/backend`, pero el código vive en `my-app/` y `server/`.
   - Resultado: scripts raíz no representan la estructura actual y confunden instalación/CI.

2. **Migración de dominio a medias (Budget → Presupuesto)**
   - La app principal ya usa pantallas nuevas (`CreatePresupuestoScreen`, `PresupuestoDetailScreen`, `PresupuestoPDFScreen`), pero conserva nombres de rutas legacy (`CreateBudget`, `BudgetDetail`, `BudgetPDF`).
   - Existen pantallas y componentes legacy que aún referencian tipos y storages eliminados (`Budget`, `budgetStorage`, `jobsStorage`).

3. **El proyecto no compila en TypeScript actualmente**
   - Al correr `npx tsc --noEmit`, aparecen errores por imports rotos y tipos inexistentes en archivos legacy.

4. **Configuración de lint rota**
   - `expo lint` falla con `TypeError: Plugin "" not found`, señal de configuración incompatible o incompleta en `eslint.config.js`/ecosistema.

5. **Documentación desalineada con el estado actual**
   - Hay documentación que habla de archivos legacy (`budgetStorage.ts`, `jobsStorage.ts`) aunque ya no existen, lo que eleva el costo de mantenimiento.

## Cómo proceder desde ahora (orden recomendado)

### Fase 1 — Estabilización (bloqueante)
1. Corregir `package.json` raíz para reflejar carpetas reales (`my-app`, `server`) o quitar workspaces si no aplica.
2. Decidir una única convención de rutas de navegación (`Presupuesto*`) y renombrar rutas/params para consistencia.
3. Eliminar o aislar archivos legacy que rompen compilación (si se mantienen como referencia, moverlos fuera de `src/` o excluirlos en `tsconfig`).
4. Ajustar tipado de SQLite a la versión de Expo instalada.

### Fase 2 — Calidad de build
1. Arreglar ESLint (config flat compatible con Expo 55 y plugins instalados).
2. Dejar como mínimo estos checks en verde:
   - `npx tsc --noEmit`
   - `npm -C my-app run lint`

### Fase 3 — Cierre de migración funcional
1. Alinear Home/Create/Detail/PDF para que usen los mismos nombres de ruta y params.
2. Depurar componentes legacy no usados.
3. Actualizar documentación (`PROGRESS.md`, `ESTRUCTURA.md`, `STORAGE_ARCHITECTURE.md`) para que describa el estado real.

### Fase 4 — Prevención de regresiones
1. Agregar CI mínima con typecheck + lint en cada PR.
2. Crear checklist de migración completada (sin referencias `Budget*` en código productivo).
3. Definir política de deprecación (tiempo de vida, carpeta de archivo, criterio de eliminación).

## Resultado esperado al aplicar este plan

- Build estable y reproducible.
- Código y documentación coherentes.
- Menor deuda técnica y menos errores por "doble modelo" (legacy vs nuevo).
