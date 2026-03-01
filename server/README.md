# PresuObra Backend - Setup Completo

Servidor Express + MongoDB para sincronizar datos de la app PresuObra.

## 📋 Requisitos Previos

- **Node.js** 14+ (descargar desde https://nodejs.org/)
- **MongoDB** (Local o MongoDB Atlas)
- **npm** (viene con Node.js)
- **Git** (opcional)

## 🚀 Setup Rápido (5 minutos)

### Paso 1: Descargar MongoDB

#### Opción A: MongoDB Local (Recomendado para desarrollo)

**En Windows:**
1. Descargar: https://www.mongodb.com/try/download/community
2. Ejecutar installer
3. Durante instalación, marcar "Install MongoDB as a Service"
4. MongoDB correrá automáticamente en `localhost:27017`

**En Mac:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**En Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

#### Opción B: MongoDB Atlas (Cloud - Recomendado para producción)

1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear cuenta gratuita
3. Crear un cluster (M0 es gratis)
4. En "Connect" > "Connect Your Application"
5. Copiar la connection string
6. Reemplazar `<password>` con tu password

**Ejemplo MongoDB Atlas:**
```
mongodb+srv://usuario:password@cluster0.abc123.mongodb.net/presuobra?retryWrites=true&w=majority
```

### Paso 2: Clonar/Copiar el Servidor

```bash
# Si ya lo copiaste desde el proyecto
cd server

# Si no, crear carpeta
mkdir presuobra-backend
cd presuobra-backend
# Copiar archivos: index.js, package.json, .env.example
```

### Paso 3: Instalar Dependencias

```bash
npm install
```

Esto descargará:
- `express` - Framework web
- `mongoose` - Driver de MongoDB
- `cors` - Permitir solicitudes desde la app
- `dotenv` - Cargar variables de entorno

### Paso 4: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# O en Windows:
copy .env.example .env
```

Editar `.env`:

```env
# Para desarrollo local:
MONGODB_URI=mongodb://localhost:27017/presuobra
PORT=3000
HOST=localhost
CORS_ORIGIN=*
NODE_ENV=development

# Para producción con MongoDB Atlas:
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/presuobra?retryWrites=true&w=majority
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=https://tu-app.com
NODE_ENV=production
```

### Paso 5: Iniciar el Servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# O modo producción
npm start
```

**Deberías ver:**
```
✅ Connected to MongoDB

╔════════════════════════════════════════╗
║     PresuObra Backend Server           ║
║     Ready to accept connections        ║
╚════════════════════════════════════════╝

📍 Server: http://localhost:3000
🗄️  Database: mongodb://localhost:27017/presuobra
🔗 CORS Origin: Any origin

Available endpoints:
  GET  /api/health
  GET  /api/budgets
  GET  /api/budgets/initial
  POST /api/budgets
  GET  /api/jobs
  POST /api/jobs

Press CTRL+C to stop the server
```

## 🧪 Probar el Servidor

### Opción 1: En el Navegador

```
http://localhost:3000
```

Deberías ver:
```json
{
  "success": true,
  "message": "PresuObra Backend Server",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### Opción 2: Con cURL (Terminal)

```bash
# Verificar salud del servidor
curl http://localhost:3000/api/health

# Obtener trabajos (estará vacío inicialmente)
curl http://localhost:3000/api/jobs

# Crear un trabajo de ejemplo
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "name": "Albañilería",
    "estimatedMaterials": ["Cemento", "Arena", "Ladrillos"]
  }'
```

### Opción 3: Con Postman

1. Descargar Postman: https://www.postman.com/downloads/
2. Importar colección (ver sección de abajo)
3. Hacer requests

## 📖 API Endpoints

### Health Check
```
GET /api/health
```

Respuesta:
```json
{
  "success": true,
  "message": "Server is running",
  "mongodb": "connected"
}
```

### Presupuestos (Budgets)

#### Obtener datos iniciales
```
GET /api/budgets/initial?limit=100
```

#### Listar todos
```
GET /api/budgets?page=1&limit=50
```

#### Obtener uno
```
GET /api/budgets/:id
```

#### Crear o actualizar
```
POST /api/budgets
Content-Type: application/json

{
  "id": "budget-123",
  "clientOrProject": "Reforma casa calle principal",
  "totalAmount": 5000.50,
  "works": [
    {
      "id": "work-1",
      "jobName": "Albañilería",
      "quantity": 10,
      "unitPrice": 500,
      "total": 5000,
      "estimatedMaterials": ["Cemento", "Arena"]
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Eliminar
```
DELETE /api/budgets/:id
```

### Trabajos (Jobs)

#### Listar todos
```
GET /api/jobs?limit=100
```

#### Obtener uno
```
GET /api/jobs/:id
```

#### Crear o actualizar
```
POST /api/jobs
Content-Type: application/json

{
  "id": "job-1",
  "name": "Pintura",
  "estimatedMaterials": ["Pintura", "Rodillo", "Brocha"]
}
```

#### Eliminar
```
DELETE /api/jobs/:id
```

## 🔗 Conectar la App Mobile

### Paso 1: Obtener IP de tu computadora

**En Windows (PowerShell):**
```powershell
ipconfig
# Buscar "IPv4 Address" bajo tu adaptador de red activo
# Ej: 192.168.1.100
```

**En Mac/Linux:**
```bash
ifconfig | grep inet
# Buscar la IP local (ej: 192.168.1.100)
```

### Paso 2: Configurar URL en la App

En el archivo `my-app/.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

O en `src/App.tsx`:
```typescript
import { initSyncService } from './src/storage/syncService';

initSyncService({
  apiUrl: 'http://192.168.1.100:3000/api'
});
```

### Paso 3: Asegurar que la App y Servidor están en la misma red

- App y servidor deben estar en el mismo WiFi
- O usar emulador de Android que pueda acceder a `localhost:3000`

## 📊 Cargar Datos Iniciales

Puedes cargar datos de ejemplo en MongoDB usando un script:

```bash
# Crear archivo seed.js
cat > seed.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

const jobSchema = new mongoose.Schema({
  id: String,
  name: { type: String, unique: true },
  estimatedMaterials: [String]
});

const Job = mongoose.model('Job', jobSchema);

const defaultJobs = [
  {
    id: '1',
    name: 'Albañilería',
    estimatedMaterials: ['Cemento', 'Arena', 'Ladrillos', 'Mortero']
  },
  {
    id: '2',
    name: 'Pintura',
    estimatedMaterials: ['Pintura', 'Rodillo', 'Brocha']
  },
  {
    id: '3',
    name: 'Electricidad',
    estimatedMaterials: ['Cable eléctrico', 'Interruptores', 'Tomas']
  },
  {
    id: '4',
    name: 'Plomería',
    estimatedMaterials: ['Tuberías', 'Llaves', 'Codos']
  }
];

async function seed() {
  try {
    await Job.deleteMany({});
    await Job.insertMany(defaultJobs);
    console.log('✅ Datos iniciales cargados');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seed();
EOF

# Ejecutar seed
node seed.js
```

## 🐛 Troubleshooting

### "Error: connect ECONNREFUSED"
**Problema:** MongoDB no está corriendo
**Solución:**
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

### "MongoError: authentication failed"
**Problema:** Contraseña incorrecta en MongoDB Atlas
**Solución:**
- Verificar usuario y password en .env
- Verificar que el IP está whitelisted en MongoDB Atlas

### "CORS error"
**Problema:** La app no puede conectar al servidor
**Solución:**
- Verificar que `CORS_ORIGIN` en .env está correctamente configurado
- En desarrollo: `CORS_ORIGIN=*`
- En producción: `CORS_ORIGIN=https://tu-app.com`

### "Port 3000 already in use"
**Problema:** Otro proceso está usando el puerto
**Solución:**
```bash
# Cambiar puerto en .env
PORT=4000

# O matar el proceso (Windows)
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

## 🚀 Desplegar a Producción

### Opción 1: Heroku (Gratis)

```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Crear app
heroku create presuobra-backend

# Configurar MongoDB Atlas
heroku config:set MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/presuobra"
heroku config:set NODE_ENV="production"

# Desplegar
git push heroku main
```

### Opción 2: DigitalOcean, AWS, o tu VPS

```bash
# 1. SSH a tu servidor
ssh root@tu-servidor-ip

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clonar repositorio
git clone https://github.com/tu-usuario/presuobra-backend.git
cd presuobra-backend

# 4. Instalar dependencias
npm install

# 5. Configurar variables
nano .env
# Configurar MONGODB_URI, PORT, etc.

# 6. Instalar PM2 (process manager)
sudo npm install -g pm2

# 7. Iniciar servidor
pm2 start index.js --name "presuobra-backend"
pm2 save
pm2 startup

# 8. Configurar Nginx (opcional, recomendado)
sudo apt install nginx
# ... configurar proxy inverso
```

## 📚 Documentación Adicional

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [REST API Best Practices](https://restfulapi.net/)

## 💡 Notas

- El servidor está lista para desarrollo inmediato
- En producción, agregar autenticación (JWT, OAuth, etc.)
- Implementar rate limiting para proteger contra abuso
- Agregar validación más rigurosa de datos
- Implementar logs más detallados
- Agregar tests automáticos

## 📞 Soporte

Si tienes problemas:
1. Revisar los logs del servidor
2. Verificar que MongoDB está corriendo
3. Verificar conexión de red
4. Consultar la documentación oficial de Express y Mongoose
