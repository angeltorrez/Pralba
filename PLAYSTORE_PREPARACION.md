# Auditoría técnica y plan para publicar PresuObra en Play Store

## Estado actual (hallazgos principales)

### 1) Incoherencias de estructura
- El `package.json` raíz estaba apuntando a `packages/frontend` y `packages/backend` cuando el repo real usa `my-app/` y `server/`.
- Esto afecta instalación, scripts y CI/CD.

### 2) Configuración de API en móvil
- Había consumo de backend con `process.env.API_URL` en una capa y `process.env.EXPO_PUBLIC_API_URL` en otra.
- En Expo, para runtime móvil, la convención correcta es `EXPO_PUBLIC_*`.

### 3) Endpoint faltante para sincronización
- El móvil consultaba `GET /api/trabajo-materiales`, pero backend solo exponía `POST /api/trabajo-materiales`.
- Resultado: sincronización parcial del catálogo de materiales por trabajo.

### 4) Datos semilla desactualizados
- `server/seed.js` sigue modelo legacy (`Job`, `Budget`) y no el esquema relacional actual (`Cliente`, `TrabajoCatalogo`, `Material`, `Presupuesto`).
- Riesgo: entorno de demo/pruebas inconsistente con producción.

### 5) Lint sin errores, pero con deuda de warnings
- No hay errores bloqueantes, pero sí warnings por variables sin usar, `any`, y reglas de array type.
- No impide publicar, pero sí reduce calidad y mantenibilidad.

---

## Qué falta para quedar totalmente funcional antes de Play Store

## Bloque A — Funcionalidad crítica (obligatorio)
1. **Reescribir `server/seed.js` al esquema actual**.
2. **Eliminar uso de IDs derivados de `_id` por truncado hexadecimal** en sincronización móvil (riesgo de colisión).
3. **Definir y documentar la URL de backend de producción** (`EXPO_PUBLIC_API_URL`) con HTTPS real.
4. **Test de flujo completo en dispositivo real**:
   - primera sincronización,
   - crear presupuesto offline,
   - reconectar y sincronizar,
   - abrir detalle y generar PDF.

## Bloque B — Requisitos Play Store (obligatorio)
1. **Identidad de app**
   - nombre final, ícono final, splash final, descripción y categoría.
2. **Políticas y legal**
   - URL de política de privacidad pública.
   - email de soporte y contacto.
3. **Android release**
   - generar AAB de producción con EAS.
   - revisar versiónCode/autoIncrement.
4. **Pruebas de release**
   - instalar AAB en internal testing de Play Console.
   - validar en Android 11+ y Android 13/14.
5. **Store listing**
   - screenshots (teléfono), gráfico destacado (si aplica), texto corto/largo.

## Bloque C — Calidad recomendada (muy aconsejable)
1. Cerrar warnings de lint más relevantes.
2. Agregar tests de integración para storage/sync.
3. Definir monitoreo mínimo backend (logs + health endpoint + uptime).
4. Configurar CI para `tsc` + `lint` en cada PR.

---

## Ruta recomendada por semanas

### Semana 1
- Migrar `seed.js` al esquema actual.
- Asegurar sincronización completa (incluyendo trabajo-materiales).
- Ejecutar checklist funcional end-to-end en Android real.

### Semana 2
- Preparar assets y textos de Play Store.
- Publicar build interna (Internal testing).
- Corregir issues de QA y preparar release de producción.

---

## Comandos sugeridos de pre-lanzamiento

```bash
# Frontend
cd my-app
npx tsc --noEmit
npm run lint

# Backend
cd ../server
npm run start

# Build Android AAB (requiere EAS config y credenciales)
cd ../my-app
eas build --platform android --profile production

# Envío a Play Console (opcional automatizado)
eas submit --platform android --profile production
```

---

## Criterio de “listo para publicar”

Puedes considerar la app lista cuando:
- no hay fallos en el flujo offline/online,
- backend y seed usan el mismo modelo de datos,
- build AAB instala y funciona en test interno,
- tienes política de privacidad y ficha de Play completa,
- no quedan errores de build/lint/typecheck.
