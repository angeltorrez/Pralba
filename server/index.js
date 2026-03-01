#!/usr/bin/env node

/**
 * PresuObra Backend Server
 * MongoDB + Express
 * 
 * Este servidor maneja la sincronización de datos entre la app mobile y MongoDB
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/presuobra';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(error => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// ============================================
// SCHEMAS
// ============================================

// 1️⃣ CLIENTES
const clienteSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    index: true 
  },
  telefono: String,
  direccion: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 2️⃣ TRABAJOS CATÁLOGO (Lista de precios base)
const trabajoCatalogoSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  unidad_medida: { 
    type: String, 
    required: true,
    enum: ['m2', 'm', 'ml', 'unidad', 'hora', 'día']
  },
  precio_unitario: { 
    type: Number, 
    required: true,
    min: 0
  },
  descripcion: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 3️⃣ MATERIALES CATÁLOGO
const materialSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  unidad_medida: { 
    type: String, 
    required: true,
    enum: ['kg', 'l', 'u', 'bolsas', 'm', 'm2', 'm3']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 4️⃣ RELACIÓN TRABAJO ↔ MATERIAL
const trabajoMaterialSchema = new mongoose.Schema({
  trabajo_catalogo_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TrabajoCatalogo',
    required: true 
  },
  material_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Material',
    required: true 
  },
  cantidad_por_unidad: { 
    type: Number, 
    required: true,
    min: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 5️⃣ TRABAJOS EN PRESUPUESTO
const trabajoPresupuestoSchema = new mongoose.Schema({
  presupuesto_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Presupuesto',
    required: true 
  },
  trabajo_catalogo_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TrabajoCatalogo',
    required: true 
  },
  cantidad: { 
    type: Number, 
    required: true,
    min: 0
  },
  precio_unitario: { 
    type: Number, 
    required: true,
    min: 0
  },
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 6️⃣ PRESUPUESTOS
const presupuestoSchema = new mongoose.Schema({
  cliente_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cliente',
    required: true 
  },
  fecha: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  total_mano_obra: { 
    type: Number, 
    default: 0,
    min: 0
  },
  total_final: { 
    type: Number, 
    default: 0,
    min: 0
  },
  trabajos: [trabajoPresupuestoSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ============================================
// MODELS
// ============================================

const Cliente = mongoose.model('Cliente', clienteSchema);
const TrabajoCatalogo = mongoose.model('TrabajoCatalogo', trabajoCatalogoSchema);
const Material = mongoose.model('Material', materialSchema);
const TrabajoMaterial = mongoose.model('TrabajoMaterial', trabajoMaterialSchema);
const TrabajoPresupuesto = mongoose.model('TrabajoPresupuesto', trabajoPresupuestoSchema);
const Presupuesto = mongoose.model('Presupuesto', presupuestoSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

const validatePresupuestoData = (data) => {
  if (!data.cliente_id) return { valid: false, error: 'Cliente ID is required' };
  if (!Array.isArray(data.trabajos)) return { valid: false, error: 'Trabajos must be an array' };
  if (typeof data.total_mano_obra !== 'number' || data.total_mano_obra < 0) {
    return { valid: false, error: 'Total mano de obra must be a positive number' };
  }
  return { valid: true };
};

const validateClienteData = (data) => {
  if (!data.nombre || data.nombre.trim() === '') return { valid: false, error: 'Cliente nombre is required' };
  return { valid: true };
};

const validateTrabajoCatalogoData = (data) => {
  if (!data.nombre || data.nombre.trim() === '') return { valid: false, error: 'Trabajo nombre is required' };
  if (!data.unidad_medida) return { valid: false, error: 'Unidad de medida is required' };
  if (typeof data.precio_unitario !== 'number' || data.precio_unitario < 0) {
    return { valid: false, error: 'Precio unitario must be a positive number' };
  }
  return { valid: true };
};

// ============================================
// ROUTES - TRABAJOS CATÁLOGO (Precios base)
// ============================================

/**
 * GET /api/trabajos-catalogo
 * Obtener lista de trabajos disponibles con precios
 */
app.get('/api/trabajos-catalogo', async (req, res) => {
  try {
    const trabajos = await TrabajoCatalogo.find()
      .sort({ nombre: 1 })
      .lean();
    
    res.json({ 
      success: true, 
      trabajos,
      count: trabajos.length
    });
  } catch (error) {
    console.error('Error fetching trabajos catalogo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/trabajos-catalogo/:id
 * Obtener trabajo específico con sus materiales
 */
app.get('/api/trabajos-catalogo/:id', async (req, res) => {
  try {
    const trabajo = await TrabajoCatalogo.findById(req.params.id).lean();
    if (!trabajo) {
      return res.status(404).json({ success: false, error: 'Trabajo not found' });
    }

    const materiales = await TrabajoMaterial.find({ trabajo_catalogo_id: req.params.id })
      .populate('material_id')
      .lean();

    res.json({ success: true, trabajo, materiales });
  } catch (error) {
    console.error('Error fetching trabajo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/trabajos-catalogo
 * Crear nuevo trabajo en catálogo
 */
app.post('/api/trabajos-catalogo', async (req, res) => {
  try {
    const { valid, error } = validateTrabajoCatalogoData(req.body);
    if (!valid) return res.status(400).json({ success: false, error });

    const trabajo = new TrabajoCatalogo(req.body);
    await trabajo.save();

    res.status(201).json({ success: true, trabajo });
  } catch (error) {
    console.error('Error creating trabajo catalogo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROUTES - MATERIALES
// ============================================

/**
 * GET /api/materiales
 * Obtener lista de materiales disponibles
 */
app.get('/api/materiales', async (req, res) => {
  try {
    const materiales = await Material.find()
      .sort({ nombre: 1 })
      .lean();
    
    res.json({ 
      success: true, 
      materiales,
      count: materiales.length
    });
  } catch (error) {
    console.error('Error fetching materiales:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/materiales
 * Crear nuevo material
 */
app.post('/api/materiales', async (req, res) => {
  try {
    if (!req.body.nombre || !req.body.unidad_medida) {
      return res.status(400).json({ success: false, error: 'Nombre and unidad_medida are required' });
    }

    const material = new Material(req.body);
    await material.save();

    res.status(201).json({ success: true, material });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROUTES - TRABAJO ↔ MATERIAL (Relación)
// ============================================

/**
 * POST /api/trabajo-materiales
 * Asociar material a un trabajo
 */
app.post('/api/trabajo-materiales', async (req, res) => {
  try {
    const { trabajo_catalogo_id, material_id, cantidad_por_unidad } = req.body;
    
    if (!trabajo_catalogo_id || !material_id || cantidad_por_unidad === undefined) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const asoc = new TrabajoMaterial(req.body);
    await asoc.save();

    res.status(201).json({ success: true, asoc });
  } catch (error) {
    console.error('Error creating trabajo material:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROUTES - CLIENTES
// ============================================

/**
 * GET /api/clientes
 * Obtener lista de clientes
 */
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find()
      .sort({ nombre: 1 })
      .lean();
    
    res.json({ 
      success: true, 
      clientes,
      count: clientes.length
    });
  } catch (error) {
    console.error('Error fetching clientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/clientes/:id
 * Obtener cliente específico
 */
app.get('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id).lean();
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente not found' });
    }

    res.json({ success: true, cliente });
  } catch (error) {
    console.error('Error fetching cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/clientes
 * Crear nuevo cliente
 */
app.post('/api/clientes', async (req, res) => {
  try {
    const { valid, error } = validateClienteData(req.body);
    if (!valid) return res.status(400).json({ success: false, error });

    const cliente = new Cliente(req.body);
    await cliente.save();

    res.status(201).json({ success: true, cliente });
  } catch (error) {
    console.error('Error creating cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/clientes/:id
 * Actualizar cliente
 */
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente not found' });
    }

    res.json({ success: true, cliente });
  } catch (error) {
    console.error('Error updating cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROUTES - PRESUPUESTOS
// ============================================

/**
 * GET /api/presupuestos
 * Obtener lista de presupuestos con paginación
 */
app.get('/api/presupuestos', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const presupuestos = await Presupuesto.find()
      .populate('cliente_id')
      .skip(skip)
      .limit(limit)
      .sort({ fecha: -1 })
      .lean();
    
    const total = await Presupuesto.countDocuments();

    res.json({ 
      success: true, 
      presupuestos,
      count: presupuestos.length,
      total,
      skip,
      limit
    });
  } catch (error) {
    console.error('Error fetching presupuestos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/presupuestos/inicial
 * Obtener datos iniciales para primer acceso
 */
app.get('/api/presupuestos/inicial', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const [clientes, trabajos, presupuestos] = await Promise.all([
      Cliente.find().lean(),
      TrabajoCatalogo.find().lean(),
      Presupuesto.find().limit(limit).sort({ fecha: -1 }).lean()
    ]);

    res.json({ 
      success: true, 
      clientes,
      trabajos,
      presupuestos,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching initial data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/presupuestos/:id
 * Obtener presupuesto específico con detalles completos
 */
app.get('/api/presupuestos/:id', async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findById(req.params.id)
      .populate('cliente_id')
      .populate({
        path: 'trabajos.trabajo_catalogo_id',
        model: 'TrabajoCatalogo'
      })
      .lean();

    if (!presupuesto) {
      return res.status(404).json({ success: false, error: 'Presupuesto not found' });
    }

    res.json({ success: true, presupuesto });
  } catch (error) {
    console.error('Error fetching presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/presupuestos
 * Crear nuevo presupuesto
 * Body: { cliente_id, trabajos: [{ trabajo_catalogo_id, cantidad, precio_unitario, subtotal }], total_mano_obra }
 */
app.post('/api/presupuestos', async (req, res) => {
  try {
    const { valid, error } = validatePresupuestoData(req.body);
    if (!valid) return res.status(400).json({ success: false, error });

    // Calcular total_final = total_mano_obra (total de subtotales)
    const total_final = req.body.trabajos.reduce((sum, t) => sum + (t.subtotal || 0), 0);

    const presupuesto = new Presupuesto({
      ...req.body,
      total_final
    });

    await presupuesto.save();
    await presupuesto.populate('cliente_id');

    res.status(201).json({ success: true, presupuesto });
  } catch (error) {
    console.error('Error creating presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/presupuestos/:id
 * Actualizar presupuesto
 */
app.put('/api/presupuestos/:id', async (req, res) => {
  try {
    const total_final = req.body.trabajos.reduce((sum, t) => sum + (t.subtotal || 0), 0);

    const presupuesto = await Presupuesto.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        total_final,
        updatedAt: new Date() 
      },
      { new: true }
    ).populate('cliente_id');

    if (!presupuesto) {
      return res.status(404).json({ success: false, error: 'Presupuesto not found' });
    }

    res.json({ success: true, presupuesto });
  } catch (error) {
    console.error('Error updating presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/presupuestos/:id
 * Eliminar presupuesto
 */
app.delete('/api/presupuestos/:id', async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findByIdAndDelete(req.params.id);

    if (!presupuesto) {
      return res.status(404).json({ success: false, error: 'Presupuesto not found' });
    }

    res.json({ success: true, message: 'Presupuesto deleted', presupuesto });
  } catch (error) {
    console.error('Error deleting presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROUTES - HEALTH CHECK
// ============================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'PresuObra Backend Server',
    version: '2.0.0',
    description: 'API for budget management with relational database',
    endpoints: {
      health: 'GET /api/health',
      'trabajos-catalogo': 'GET /api/trabajos-catalogo',
      materiales: 'GET /api/materiales',
      clientes: 'GET /api/clientes',
      presupuestos: 'GET /api/presupuestos'
    }
  });
});

// ============================================
// ERROR HANDLING & SERVER START
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     PresuObra Backend Server           ║');
  console.log('║     Ready to accept connections        ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${mongoUri}\n`);
});

module.exports = server;
