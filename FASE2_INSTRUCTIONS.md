# INSTRUCCIONES PARA FASE 2
## Completar la Implementación de PresuObra

> **Estado actual**: Infraestructura de almacenamiento ✅ | UI/Screens ❌

---

## PASO 1: Finalizar App.tsx Naming

Actualiza los nombres de las rutas para reflejar la nueva nomenclatura:

```tsx
// ANTES:
<Stack.Screen name="CreateBudget" component={CreateBudgetScreen} />
<Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
<Stack.Screen name="BudgetPDF" component={BudgetPDFScreen} />

// DESPUÉS:
<Stack.Screen name="CreatePresupuesto" component={CreatePresupuestoScreen} />
<Stack.Screen name="PresupuestoDetail" component={PresupuestoDetailScreen} />
<Stack.Screen name="PresupuestoPDF" component={PresupuestoPDFScreen} />

// Y renombra los archivos:
// CreateBudgetScreen.tsx → CreatePresupuestoScreen.tsx
// BudgetDetailScreen.tsx → PresupuestoDetailScreen.tsx
// BudgetPDFScreen.tsx → PresupuestoPDFScreen.tsx
```

---

## PASO 2: Crear CreatePresupuestoScreen.tsx

Este es el screen más importante. Debe implementar este flujo:

```
┌─────────────────────────────────┐
│  1. CLIENTE (Selector)          │
│     [Buscar/Crear cliente]      │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  2. TRABAJOS (Agregar items)    │
│     [Lista de trabajos]         │
│     [Click → Agregar trabajo]   │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  3. TRABAJO AÑADIDO             │
│     Nombre: ___________         │
│     Cantidad: [input] m2        │
│     Precio: $ 250.00 (auto)     │
│     Subtotal: $ 2,500 (auto)    │
│     [Eliminar línea]            │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  4. MATERIALES (Preview)        │
│     ℹ️ Informativos solamente    │
│     Arena: 5 m3                 │
│     Cemento: 2 bolsas           │
│     Agua: 1000 l                │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│  RESUMEN                        │
│  Total Mano Obra:   $ 2,500.00  │
│  Total Final:       $ 2,500.00  │
│  [Guardar] [Cancelar]           │
└─────────────────────────────────┘
```

### Pseudo-código:

```typescript
export const CreatePresupuestoScreen: React.FC = ({ navigation }) => {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [trabajosEnPresupuesto, setTrabajosEnPresupuesto] = useState<TrabajoPresupuesto[]>([]);
  
  const handleSelectCliente = (c: Cliente) => {
    setCliente(c);
  };
  
  const handleSelectTrabajo = async (trabajo: TrabajoCatalogo) => {
    // Abre modal para ingresar cantidad
    // Al confirmar:
    const nuevoTrabajo = {
      trabajo_catalogo_id: trabajo.id,
      cantidad: userInputQuantity,
      precio_unitario: trabajo.precio_unitario  // ◄─ COPY
    };
    setTrabajosEnPresupuesto([...trabajosEnPresupuesto, nuevoTrabajo]);
  };
  
  const handleGuardar = async () => {
    const presupuesto = await hybridJobsStorage.createPresupuestoWithSync({
      cliente_id: cliente!.id,
      fecha: Date.now(),
      trabajos: trabajosEnPresupuesto
    });
    navigation.navigate('PresupuestoDetail', { presupuestoId: presupuesto.id });
  };
  
  return (
    // Layout como el diagrama arriba
  );
};
```

---

## PASO 3: Actualizar PresupuestoDetailScreen.tsx

```typescript
const [presupuesto, setPresupuesto] = useState<PresupuestoDetalle | null>(null);

useEffect(() => {
  const presupuestoStorage = getPresupuestoStorage();
  presupuestoStorage.getPresupuestoDetalle(presupuestoId)
    .then(setPresupuesto);
}, [presupuestoId]);

// Mostrar:
// - Cliente name
// - Fecha
// - Tabla de trabajos:
//   | Trabajo | Qty | Precio Unit. | Subtotal |
// - Totales
// - Tabla de materiales (informativa)
// - Botón [Editar]
// - Botón [PDF]
// - Botón [Eliminar]
```

---

## PASO 4: Crear seed.js

Actualiza `server/seed.js` con el nuevo schema:

```javascript
const seedDatabase = async () => {
  // 1. Crear clientes
  const clientes = await Cliente.create([
    { nombre: 'Juan García', telefono: '555-1234', direccion: 'Calle Principal 123' },
    { nombre: 'María López', telefono: '555-5678', direccion: 'Av. Central 456' }
  ]);

  // 2. Crear materiales
  const materiales = await Material.create([
    { nombre: 'Arena', unidad_medida: 'm3' },
    { nombre: 'Cemento', unidad_medida: 'bolsas' },
    { nombre: 'Agua', unidad_medida: 'l' }
  ]);

  // 3. Crear trabajos catálogo
  const trabajos = await TrabajoCatalogo.create([
    { 
      nombre: 'Repello m2', 
      unidad_medida: 'm2', 
      precio_unitario: 250,
      descripcion: 'Repello de pared por metro cuadrado'
    },
    { 
      nombre: 'Piso m2', 
      unidad_medida: 'm2', 
      precio_unitario: 450,
      descripcion: 'Colocación de piso'
    }
  ]);

  // 4. Crear relaciones trabajo-material
  await TrabajoMaterial.create([
    { 
      trabajo_catalogo_id: trabajos[0]._id,
      material_id: materiales[0]._id,
      cantidad_por_unidad: 0.5  // 0.5 m3 arena per m2
    },
    { 
      trabajo_catalogo_id: trabajos[0]._id,
      material_id: materiales[1]._id,
      cantidad_por_unidad: 0.1  // 0.1 bolsas per m2
    }
  ]);

  console.log('✅ Seed completed');
};
```

---

## PASO 5: Actualizar Componentes

Si existen componentes que usan Budget, actualízalos:

- [ ] Eliminar o actualizar `BudgetCard.tsx`
- [ ] Crear `ClienteSelector.tsx` (autocomplete de clientes)
- [ ] Crear `TrabajoSelector.tsx` (busca en catálogo)
- [ ] Crear `TrabajoLineItem.tsx` (muestra trabajo + cantidad + subtotal)

---

## PASO 6: Testing

Crea un archivo de testing manual:

```markdown
# TESTING CHECKLIST

## Crear Presupuesto
- [ ] App inicia correctamente
- [ ] Home muestra presupuestos existentes
- [ ] Click floating button → CreatePresupuestoScreen
- [ ] Buscar cliente funciona
- [ ] Click en trabajo → abre modal cantidad
- [ ] Ingresa cantidad → calcula subtotal automáticamente
- [ ] Total se calcula correctamente
- [ ] Materiales se muestran (informativos)
- [ ] Click Guardar → presupuesto se guarda locally
- [ ] Vuelve a Home y muestra presupuesto nuevo

## Sincronización
- [ ] App con internet:
  - [ ] Catálogo se sincroniza al abrir
  - [ ] Presupuestos se cargan desde backend
- [ ] App offline:
  - [ ] Crea presupuesto en local SQLite
  - [ ] No intenta conectar (no genera errores)
  - [ ] Al volver online, sync intenta subir

## Histórico
- [ ] Crea presupuesto con trabajo a $250
- [ ] Cambia precio en backend a $300
- [ ] Presupuesto antiguo sigue mostrando $250 ✓
```

---

## ESTRUCTURA FINAL ESPERADA

```
my-app/
├── src/
│   ├── components/
│   │   ├── BudgetCard.tsx → REMOVE (deprecated)
│   │   ├── SettingsButton.tsx
│   │   ├── SettingsMenu.tsx
│   │   ├── ClienteSelector.tsx  ← NEW
│   │   ├── TrabajoSelector.tsx  ← NEW
│   │   └── TrabajoLineItem.tsx  ← NEW
│   ├── screens/
│   │   ├── HomeScreen.tsx ✓ (updated)
│   │   ├── CreatePresupuestoScreen.tsx ← NEW
│   │   ├── PresupuestoDetailScreen.tsx ← NEW (renamed)
│   │   └── PresupuestoPDFScreen.tsx ← NEW (renamed)
│   ├── storage/
│   │   ├── database.ts ✓
│   │   ├── clienteStorage.ts ✓
│   │   ├── trabajoCatalogoStorage.ts ✓
│   │   ├── materialStorage.ts ✓
│   │   ├── presupuestoStorage.ts ✓
│   │   ├── storageFactory.ts ✓
│   │   ├── hybridJobsStorage.ts ✓
│   │   ├── syncService.ts ✓
│   │   └── budgetStorage.ts → REMOVE
│   └── ...
├── server/
│   ├── index.js ✓ (updated)
│   ├── seed.js ← UPDATE with new schema
│   └── ...
└── ...
```

---

## ESTIMACIÓN DE TIEMPO

- CreatePresupuestoScreen: **1-2 horas** ⏱️
- PresupuestoDetailScreen: **30-45 minutos**
- Componentes auxiliares: **1 hora**
- seed.js: **15-30 minutos**
- Testing: **30 minutos**

**Total Fase 2**: ~4 horas de trabajo

---

## SOPORT TÉCNICO

Si encuentras problemas:

1. **Error de imports**: Asegúrate que `storageFactory.ts` está inicializado
2. **DB locked**: Reinicia la app
3. **Storage not initialized**: Verifica que `useStorageInit` se ejecutó
4. **Precios incorrectos**: Revisa que `precio_unitario` se copia en `createPresupuesto`

