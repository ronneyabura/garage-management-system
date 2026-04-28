import { PrismaClient, VehicleStatus, JobCardStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Users
  const hashedPwd = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gms.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@gms.com', password: hashedPwd, role: 'ADMIN', phone: '+254700000001' },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@gms.com' },
    update: {},
    create: { name: 'Jane Mwangi', email: 'manager@gms.com', password: hashedPwd, role: 'MANAGER', phone: '+254700000002' },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: 'tech1@gms.com' },
    update: {},
    create: { name: 'John Kamau', email: 'tech1@gms.com', password: hashedPwd, role: 'WORKSHOP_STAFF', phone: '+254700000003' },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'tech2@gms.com' },
    update: {},
    create: { name: 'Peter Odhiambo', email: 'tech2@gms.com', password: hashedPwd, role: 'WORKSHOP_STAFF', phone: '+254700000004' },
  });

  // Vehicles
  const vehicleData = [
    { plateNumber: 'KDA 123A', make: 'Toyota', model: 'Land Cruiser', year: 2020, color: 'White', mileage: 45000, assignedDriver: 'David Njoroge', status: 'AVAILABLE' as VehicleStatus, fuelType: 'Diesel' },
    { plateNumber: 'KDB 456B', make: 'Isuzu', model: 'NQR', year: 2019, color: 'Blue', mileage: 120000, assignedDriver: 'Samuel Weru', status: 'UNDER_REPAIR' as VehicleStatus, fuelType: 'Diesel' },
    { plateNumber: 'KDC 789C', make: 'Toyota', model: 'Hilux', year: 2021, color: 'Silver', mileage: 32000, assignedDriver: 'Grace Atieno', status: 'IN_SERVICE' as VehicleStatus, fuelType: 'Diesel' },
    { plateNumber: 'KDD 012D', make: 'Mercedes', model: 'Sprinter', year: 2018, color: 'White', mileage: 210000, assignedDriver: 'Moses Kipkoech', status: 'AVAILABLE' as VehicleStatus, fuelType: 'Diesel' },
    { plateNumber: 'KDE 345E', make: 'Mitsubishi', model: 'Canter', year: 2017, color: 'Yellow', mileage: 180000, assignedDriver: 'Alice Wanjiku', status: 'OUT_OF_SERVICE' as VehicleStatus, fuelType: 'Diesel' },
    { plateNumber: 'KDF 678F', make: 'Ford', model: 'Ranger', year: 2022, color: 'Black', mileage: 15000, assignedDriver: 'Brian Mutua', status: 'AVAILABLE' as VehicleStatus, fuelType: 'Petrol' },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {},
      create: v,
    });
    vehicles.push(vehicle);
  }

  // Parts
  const partsData = [
    { name: 'Engine Oil Filter', partNumber: 'EOF-001', category: 'Filters', quantity: 45, minQuantity: 10, unitCost: 850, supplier: 'AutoParts Kenya' },
    { name: 'Air Filter', partNumber: 'AF-002', category: 'Filters', quantity: 3, minQuantity: 8, unitCost: 1200, supplier: 'AutoParts Kenya' },
    { name: 'Brake Pads (Front)', partNumber: 'BP-003', category: 'Brakes', quantity: 12, minQuantity: 6, unitCost: 3500, supplier: 'BrakeTech Ltd' },
    { name: 'Engine Oil 5W30 (1L)', partNumber: 'EO-004', category: 'Lubricants', quantity: 80, minQuantity: 20, unitCost: 650, supplier: 'Shell Kenya' },
    { name: 'Spark Plugs (Set of 4)', partNumber: 'SP-005', category: 'Ignition', quantity: 2, minQuantity: 5, unitCost: 2800, supplier: 'NGK Distributor' },
    { name: 'Drive Belt', partNumber: 'DB-006', category: 'Engine', quantity: 8, minQuantity: 4, unitCost: 1800, supplier: 'Gates Belts' },
    { name: 'Coolant 1L', partNumber: 'CL-007', category: 'Lubricants', quantity: 30, minQuantity: 10, unitCost: 450, supplier: 'Shell Kenya' },
    { name: 'Wiper Blades (Pair)', partNumber: 'WB-008', category: 'Body', quantity: 20, minQuantity: 6, unitCost: 900, supplier: 'AutoParts Kenya' },
    { name: 'Battery 12V 90Ah', partNumber: 'BAT-009', category: 'Electrical', quantity: 4, minQuantity: 3, unitCost: 12000, supplier: 'Chloride Exide' },
    { name: 'Shock Absorber (Front)', partNumber: 'SA-010', category: 'Suspension', quantity: 6, minQuantity: 4, unitCost: 8500, supplier: 'Monroe Shocks' },
  ];

  const parts = [];
  for (const p of partsData) {
    const part = await prisma.part.upsert({
      where: { partNumber: p.partNumber },
      update: {},
      create: p,
    });
    parts.push(part);
  }

  // Job Cards
  const jc1 = await prisma.jobCard.create({
    data: {
      jobNumber: 'JC-2024-100001',
      vehicleId: vehicles[0].id,
      technicianId: tech1.id,
      createdById: admin.id,
      status: 'COMPLETED',
      priority: 'NORMAL',
      description: 'Routine 10,000km service - oil change, filter replacement',
      diagnosis: 'Scheduled maintenance service',
      workDone: 'Changed engine oil, replaced oil filter and air filter',
      mileageIn: 40000,
      mileageOut: 40050,
      estimatedCost: 5000,
      actualCost: 4850,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.statusLog.createMany({
    data: [
      { jobCardId: jc1.id, status: 'INTAKE', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { jobCardId: jc1.id, status: 'DIAGNOSIS', createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000) },
      { jobCardId: jc1.id, status: 'REPAIR', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { jobCardId: jc1.id, status: 'TESTING', createdAt: new Date(Date.now() - 2.2 * 24 * 60 * 60 * 1000) },
      { jobCardId: jc1.id, status: 'COMPLETED', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  });

  const repair1 = await prisma.repair.create({
    data: { jobCardId: jc1.id, description: 'Oil change and filter replacement', laborCost: 1500 },
  });

  await prisma.repairPart.createMany({
    data: [
      { repairId: repair1.id, partId: parts[0].id, quantity: 1, unitCost: 850 },
      { repairId: repair1.id, partId: parts[3].id, quantity: 4, unitCost: 650 },
    ],
  });

  const jc2 = await prisma.jobCard.create({
    data: {
      jobNumber: 'JC-2024-100002',
      vehicleId: vehicles[1].id,
      technicianId: tech2.id,
      createdById: tech1.id,
      status: 'REPAIR',
      priority: 'HIGH',
      description: 'Engine overheating - coolant system failure',
      diagnosis: 'Leaking radiator hose and low coolant level',
      mileageIn: 118000,
      estimatedCost: 15000,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.statusLog.createMany({
    data: [
      { jobCardId: jc2.id, status: 'INTAKE' },
      { jobCardId: jc2.id, status: 'DIAGNOSIS', createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000) },
      { jobCardId: jc2.id, status: 'REPAIR', createdAt: new Date(Date.now() - 0.2 * 24 * 60 * 60 * 1000) },
    ],
  });

  const jc3 = await prisma.jobCard.create({
    data: {
      jobNumber: 'JC-2024-100003',
      vehicleId: vehicles[2].id,
      technicianId: tech1.id,
      createdById: admin.id,
      status: 'DIAGNOSIS',
      priority: 'NORMAL',
      description: 'Unusual noise from front suspension',
      mileageIn: 31500,
      estimatedCost: 8000,
    },
  });

  await prisma.statusLog.createMany({
    data: [
      { jobCardId: jc3.id, status: 'INTAKE' },
      { jobCardId: jc3.id, status: 'DIAGNOSIS' },
    ],
  });

  // Inventory transactions
  await prisma.inventoryTransaction.createMany({
    data: [
      { partId: parts[0].id, type: 'IN', quantity: 50, reference: 'PO-001', notes: 'Initial stock', createdById: admin.id },
      { partId: parts[3].id, type: 'IN', quantity: 100, reference: 'PO-001', notes: 'Initial stock', createdById: admin.id },
      { partId: parts[0].id, type: 'OUT', quantity: 5, reference: jc1.id, notes: 'Used in service', createdById: tech1.id },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\nTest Credentials:');
  console.log('  Admin:   admin@gms.com / password123');
  console.log('  Manager: manager@gms.com / password123');
  console.log('  Tech 1:  tech1@gms.com / password123');
  console.log('  Tech 2:  tech2@gms.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
