# PresuObra - Arquitectura de Almacenamiento y Sincronización

## Visión General

La aplicación implementa un modelo **offline-first** con sincronización automática a MongoDB:

```
┌─────────────────────────────────────────────────┐
│              MongoDB (Backend)                   │
│          (Datos globales compartidos)            │
└────────────────────┬────────────────────────────┘
                     │
                     │ (Sincronización)
                     ▼
┌─────────────────────────────────────────────────┐
│          SQLite Local Database                   │
│      (Datos persistentes en dispositivo)         │
└────────────────────┬────────────────────────────┘
                     │
                     │ (Lectura/Escritura)
                     ▼
        ┌──────────────────────────┐
        │   App (Offline-Ready)    │
        │                          │
        │  - Funciona sin internet │
        │  - Sincroniza si hay red │
        │  - Resuelve conflictos   │
        └──────────────────────────┘
```

## Características Principales

### 1. Almacenamiento Local (SQLite)
- **Base de datos persistente** en el dispositivo
- **Índices** para búsquedas rápidas
- **Metadatos de sincronización** para rastrear cambios
- **Fallback a AsyncStorage** si SQLite falla

### 2. Funcionalidad Offline
- ✅ La app funciona **completamente offline**
- ✅ Los cambios se guardan **localmente**
- ✅ Los datos se pierden **nunca** (están en SQLite)

### 3. Sincronización Automática
- **Primera ejecución**: Descarga datos iniciales de MongoDB
- **Cambios locales**: Se sincronizan cada 5+ minutos
- **No-bloqueante**: La sincronización ocurre en background

### 4. Resolución de Conflictos
- **Server wins**: En caso de conflicto, el servidor tiene prioridad
- **Timestamps**: Se usan para detectar conflictos
- **Registro de cambios**: Todos los cambios se rastrean

## Estructura de Archivos

```
src/
├── storage/
│   ├── database.ts                # Inicialización de SQLite
│   ├── syncService.ts             # Servicio de sincronización MongoDB
│   ├── budgetStorage.ts           # Logic para presupuestos
│   ├── jobsStorage.ts             # Logic para trabajos
│   ├── hybridBudgetStorage.ts     # Capa SQLite + AsyncStorage
│   └── hybridJobsStorage.ts       # Capa SQLite + AsyncStorage
│
├── hooks/
│   └── useStorageInit.ts          # Hook para inicializar almacenamiento
│
├── utils/
│   └── dateFormatter.ts           # Utilidades de formato de fechas
│
└── constants/
    └── index.ts                   # Constantes de la app
```

## Cómo usar la Sincronización

### 1. Configurar el Backend MongoDB (Servidor)

Crea un servidor Node.js/Express con los siguientes endpoints:

```javascript
// GET /api/budgets/initial - Descargar presupuestos iniciales
// POST /api/budgets - Crear/actualizar presupuesto
// GET /api/jobs - Obtener trabajos
// POST /api/jobs - Crear trabajo
```

Ejemplo de estructura MongoDB:

```javascript
// Budgets Collection
{
  _id: ObjectId,
  id: String,
  clientOrProject: String,
  totalAmount: Number,
  works: [{
    id: String,
    jobName: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    estimatedMaterials: [String]
  }],
  createdAt: ISODate,
  updatedAt: ISODate
}

// Jobs Collection
{
  _id: ObjectId,
  id: String,
  name: String,
  estimatedMaterials: [String],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 2. Configurar la URL del API en la App

En tu archivo `.env` o `app.json`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

O inicializar manualmente después de montar la app:

```typescript
import { initSyncService } from './src/storage/syncService';

// En App.tsx o en un contexto de inicialización
initSyncService({
  apiUrl: 'https://tu-server.com/api',
  authToken: 'token-si-necesitas-auth',
  enableAutoSync: true
});
```

### 3. Usar el Almacenamiento en Componentes

```typescript
import { budgetStorage } from './storage/budgetStorage';

// Obtener todos los presupuestos
const budgets = await budgetStorage.getAllBudgets();

// Guardar un presupuesto (se sincroniza automáticamente)
await budgetStorage.saveBudget(budget);

// Eliminar un presupuesto
await budgetStorage.deleteBudget(budgetId);

// Obtener presupuesto específico
const budget = await budgetStorage.getBudgetById(budgetId);
```

### 4. Monitorear Sincronización

```typescript
import { getSyncService } from './src/storage/syncService';

const syncService = getSyncService();

// Obtener última sincronización
const lastSync = await syncService.getLastSyncTime();

// Revisar si debería sincronizar
const shouldSync = await syncService.shouldSync();

// Sincronizar manualmente
const result = await syncService.syncChanges();
console.log(`${result.itemsSynced} items sincronizados`);

// Descargar datos iniciales
const initialResult = await syncService.downloadInitialData();
```

## Flujo de Datos

### Primera Vez que el Usuario Abre la App

1. App se inicia → `useStorageInit` hook se ejecuta
2. Se inicializa SQLite database
3. Se cargan trabajos por defecto
4. Se intenta descargar datos iniciales de MongoDB
5. Si internet está disponible: datos se guardan localmente
6. Si internet no está: app funciona con datos locales vacíos

### Cuando el Usuario Crea un Presupuesto

1. Usuario crea presupuesto en la interfaz
2. Se guarda en SQLite localmente (inmediato)
3. Se marca como "no sincronizado" en la base de datos
4. Si hay internet, se sincroniza en background cada 5 minutos
5. Una vez sincronizado, se marca como "sincronizado"

### Sincronización en Background

```typescript
// The app automatically:
// 1. Checks every 5 minutes if there are unsynced changes
// 2. Sends unsynced budgets to the server
// 3. Sends unsynced jobs to the server
// 4. Updates local status when sync succeeds
// 5. Logs errors if sync fails (doesn't impact user)
```

## Optimizaciones Implementadas

### 1. Rendimiento
- ✅ **SQLite en lugar de AsyncStorage** - Más rápido para grandes conjuntos de datos
- ✅ **Índices en base de datos** - Búsquedas optimizadas
- ✅ **Memoización de componentes** - Evita re-renders innecesarios
- ✅ **Sincronización en background** - No bloquea la UI

### 2. Almacenamiento
- ✅ **Eliminar redundancia** - Funciones `formatDate` unificadas
- ✅ **Constantes centralizadas** - Menos duplicación de código
- ✅ **Arquitectura limpia** - Separación de responsabilidades

### 3. Offline-First
- ✅ **SafeAreaView optimizado** - Usa `react-native-safe-area-context`
- ✅ **Fallback layers** - Si SQLite falla, AsyncStorage como backup
- ✅ **Sincronización inteligente** - No resincroniza si no hay cambios

## Manejo de Errores

### Si SQLite falla
```typescript
// Automáticamente se cae a AsyncStorage
// El usuario no nota la diferencia
```

### Si la sincronización falla
```typescript
// Se reintenta en 5 minutos
// Los datos locales se mantienen seguros
// Los cambios no se pierden
```

### Si no hay internet
```typescript
// La app funciona normalmente
// Los cambios se guardan localmente
// La sincronización ocurre cuando vuelve internet
```

## Variables de Entorno

Crea un archivo `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_AUTH_TOKEN=tu-token-aqui
EXPO_PUBLIC_ENABLE_AUTO_SYNC=true
```

## Próximos Pasos

1. **Crear backend MongoDB**:
   - Implementar endpoints REST como se describe arriba
   - Agregar autenticación si es necesario
   - Configurar CORS para la app

2. **Mejorar sincronización**:
   - Agregar compresión de datos
   - Implementar sincronización incremental
   - Agregar caché de datos descargados

3. **Monitoreo**:
   - Agregar logs de sincronización
   - Crear pantalla de estado de sincronización
   - Alertas para conflictos de datos

4. **Seguridad**:
   - Implementar encriptación de datos locales
   - Agregar autenticación de usuario
   - Validar datos en cliente y servidor

## Referencias

- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [react-native-safe-area-context](https://github.com/th3rdEyeKind/react-native-safe-area-context)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Offline-First Architecture](https://offlinefirst.org/)
