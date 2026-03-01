#!/usr/bin/env node

/**
 * Script para cargar datos de ejemplo en MongoDB
 * 
 * Uso: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/presuobra';

console.log('🌱 Iniciando seed de datos...');
console.log('📍 MongoDB:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(error => {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  });

// Schemas
const jobSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, unique: true, required: true },
  unit: { type: String, enum: ['m2', 'm', 'unidad'], default: 'm2' },
  estimatedMaterials: [String],
  materialFormulas: [{
    name: String,
    quantity: Number,
    unit: String,
    perUnit: Number
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const budgetSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  clientOrProject: String,
  totalAmount: Number,
  works: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date
});

// Models
const Job = mongoose.model('Job', jobSchema);
const Budget = mongoose.model('Budget', budgetSchema);

// Default data
const defaultJobs = [
  {
    id: '1',
    name: 'Revoque exterior',
    unit: 'm2',
    estimatedMaterials: ['Cemento', 'Arena', 'Hidrofugo', 'Cal'],
    materialFormulas: [
      { name: 'Arena', quantity: 0.5, unit: 'm3', perUnit: 1 },
      { name: 'Cemento 25kg', quantity: 10, unit: 'bolsas', perUnit: 1 },
      { name: 'Cal 25kg', quantity: 8, unit: 'bolsas', perUnit: 1 },
      { name: 'Hidrofugo', quantity: 10, unit: 'kg', perUnit: 1 }
    ]
  },
  {
    id: '2',
    name: 'Revoque interior',
    unit: 'm2',
    estimatedMaterials: ['Cemento', 'Arena', 'Cal'],
    materialFormulas: [
      { name: 'Arena', quantity: 0.3, unit: 'm3', perUnit: 1 },
      { name: 'Cemento 25kg', quantity: 7, unit: 'bolsas', perUnit: 1 },
      { name: 'Cal 25kg', quantity: 6, unit: 'bolsas', perUnit: 1 }
    ]
  },
  {
    id: '3',
    name: 'Pared ladrillo común',
    unit: 'm2',
    estimatedMaterials: ['Ladrillo común', 'Arena', 'Cemento', 'Cal', 'Varilla de hierro'],
    materialFormulas: [
      { name: 'Ladrillo común', quantity: 70, unit: 'unidades', perUnit: 1 },
      { name: 'Arena', quantity: 0.25, unit: 'm3', perUnit: 1 },
      { name: 'Cemento 25kg', quantity: 3, unit: 'bolsas', perUnit: 1 },
      { name: 'Cal 25kg', quantity: 2, unit: 'bolsas', perUnit: 1 },
      { name: 'Varilla de hierro del 6', quantity: 2, unit: 'metros', perUnit: 1 }
    ]
  },
  {
    id: '4',
    name: 'Pared ladrillo visto',
    unit: 'm2',
    estimatedMaterials: ['Ladrillo visto', 'Arena', 'Cemento', 'Cal', 'Varilla de hierro'],
    materialFormulas: [
      { name: 'Ladrillo visto', quantity: 70, unit: 'unidades', perUnit: 1 },
      { name: 'Arena', quantity: 0.25, unit: 'm3', perUnit: 1 },
      { name: 'Cemento 25kg', quantity: 3, unit: 'bolsas', perUnit: 1 },
      { name: 'Cal 25kg', quantity: 2, unit: 'bolsas', perUnit: 1 },
      { name: 'Varilla de hierro del 6', quantity: 2, unit: 'metros', perUnit: 1 }
    ]
  },
  {
    id: '5',
    name: 'Pared ladrillo cerámico',
    unit: 'm2',
    estimatedMaterials: ['Ladrillo cerámico', 'Arena', 'Cemento', 'Cal', 'Varilla de hierro'],
    materialFormulas: [
      { name: 'Ladrillo cerámico (8,12,18)', quantity: 50, unit: 'unidades', perUnit: 1 },
      { name: 'Arena', quantity: 0.2, unit: 'm3', perUnit: 1 },
      { name: 'Cemento 25kg', quantity: 2, unit: 'bolsas', perUnit: 1 },
      { name: 'Cal 25kg', quantity: 1.5, unit: 'bolsas', perUnit: 1 },
      { name: 'Varilla de hierro del 6', quantity: 1.5, unit: 'metros', perUnit: 1 }
    ]
  }
];

const exampleBudgets = [
  {
    id: 'budget-example-001',
    clientOrProject: 'Reforma integral enero 2024',
    totalAmount: 15000,
    works: [
      {
        id: 'work-1',
        jobName: 'Albañilería',
        quantity: 5,
        unitPrice: 1000,
        total: 5000,
        estimatedMaterials: ['Cemento', 'Arena', 'Ladrillos']
      },
      {
        id: 'work-2',
        jobName: 'Pintura',
        quantity: 3,
        unitPrice: 3000,
        total: 9000,
        estimatedMaterials: ['Pintura acrílica', 'Rodillo']
      },
      {
        id: 'work-3',
        jobName: 'Electricidad',
        quantity: 1,
        unitPrice: 1000,
        total: 1000,
        estimatedMaterials: ['Cable eléctrico', 'Interruptores']
      }
    ],
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'budget-example-002',
    clientOrProject: 'Reparación plomería - Casa López',
    totalAmount: 3500,
    works: [
      {
        id: 'work-4',
        jobName: 'Plomería',
        quantity: 2,
        unitPrice: 1500,
        total: 3000,
        estimatedMaterials: ['Tuberías PVC', 'Codos']
      },
      {
        id: 'work-5',
        jobName: 'Carpintería',
        quantity: 1,
        unitPrice: 500,
        total: 500,
        estimatedMaterials: ['Madera', 'Clavos']
      }
    ],
    createdAt: new Date('2024-01-20T14:45:00Z'),
    updatedAt: new Date('2024-01-20T14:45:00Z')
  }
];

// Seed function
async function seed() {
  try {
    console.log('\n📚 Limpiando datos existentes...');
    await Job.deleteMany({});
    await Budget.deleteMany({});
    console.log('✅ Datos existentes eliminados');

    console.log('\n📝 Insertando trabajos por defecto...');
    const insertedJobs = await Job.insertMany(defaultJobs);
    console.log(`✅ ${insertedJobs.length} trabajos insertados`);
    insertedJobs.forEach(job => {
      console.log(`   - ${job.name} (${job.estimatedMaterials.length} materiales)`);
    });

    console.log('\n📋 Insertando presupuestos de ejemplo...');
    const insertedBudgets = await Budget.insertMany(exampleBudgets);
    console.log(`✅ ${insertedBudgets.length} presupuestos insertados`);
    insertedBudgets.forEach(budget => {
      console.log(`   - ${budget.clientOrProject} (${budget.works.length} trabajos, $${budget.totalAmount})`);
    });

    console.log('\n📊 Resumen:');
    const jobCount = await Job.countDocuments();
    const budgetCount = await Budget.countDocuments();
    console.log(`   - Total de trabajos: ${jobCount}`);
    console.log(`   - Total de presupuestos: ${budgetCount}`);

    console.log('\n✨ Seed completado exitosamente!');
    console.log('\n🔍 Próximos pasos:');
    console.log('   1. Iniciar servidor: npm start');
    console.log('   2. Verificar en http://localhost:3000/api/jobs');
    console.log('   3. Conectar app mobile con EXPO_PUBLIC_API_URL=http://[TU-IP]:3000/api');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante seed:', error.message);
    if (error.code === 11000) {
      console.error('\n⚠️  Error de clave duplicada. Algunos datos ya existen en la base de datos.');
      console.error('   Ejecuta nuevamente si quieres reemplazar todos los datos.');
    }
    process.exit(1);
  }
}

seed();
