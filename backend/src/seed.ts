import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPwd = await bcrypt.hash('Admin@1234', 12);
  const staffPwd = await bcrypt.hash('Staff@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gms.com' },
    update: {},
    create: { name: 'System Admin', email: 'admin@gms.com', password: adminPwd, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'manager@gms.com' },
    update: {},
    create: { name: 'Fleet Manager', email: 'manager@gms.com', password: staffPwd, role: 'MANAGER' },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'john.tech@gms.com' },
    update: {},
    create: { name: 'John Kamau', email: 'john.tech@gms.com', password: staffPwd, role: 'WORKSHOP_STAFF' },
  });

  await prisma.user.upsert({
    where: { email: 'mary.tech@gms.com' },
    update: {},
    create: { name: 'Mary Wanjiku', email: 'mary.tech@gms.com', password: staffPwd, role: 'WORKSHOP_STAFF' },
  });

  const v1 = await prisma.vehicle.upsert({
    where: { plateNumber: 'KAA 001A' },
    update: {},
    create: { plateNumber: 'KAA 001A', make: 'Toyota', model: 'Land Cruiser', year: 2020, color: 'White', assignedDriver: 'David Mwangi', status: 'AVAILABLE', mileage: 45000, fuelType: 'Diesel' },
  });

  const v2 = await prisma.vehicle.upsert({
    where: { plateNumber: 'KBB 002B' },
    update: {},
    create: { plateNumber: 'KBB 002B', make: 'Isuzu', model: 'D-Max', year: 2019, color: 'Silver', assignedDriver: 'Peter Otieno', status: 'UNDER_REPAIR', mileage: 78000, fuelType: 'Diesel' },
  });

  await prisma.vehicle.upsert({
    where: { plateNumber: 'KCC 003C' },
    update: {},
    create: { plateNumber: 'KCC 003C', make: 'Mitsubishi', model: 'Canter', year: 2018, color: 'Blue', assignedDriver: 'Grace Njeri', status: 'AVAILABLE', mileage: 120000, fuelType: 'Diesel' },
  });

  await prisma.vehicle.upsert({
    where: { plateNumber: 'KDD 004D' },
    update: {},
    create: { plateNumber: 'KDD 004D', make: 'Mercedes', model: 'Sprinter', year: 2021, color: 'Black', assignedDriver: 'James Kiprop', status: 'IN_SERVICE', mileage: 32000, fuelType: 'Diesel' },
  });

  await prisma.vehicle.upsert({
    where: { plateNumber: 'KEE 005E' },
    update: {},
    create: { plateNumber: 'KEE 005E', make: 'Toyota', model: 'Hilux', year: 2017, color: 'Red', assignedDriver: 'Anne Wambui', status: 'OUT_OF_SERVICE', mileage: 195000, fuelType: 'Petrol' },
  });

  await prisma.jobCard.create({
    data: {
      jobNumber: 'JC-2401-1001',
      vehicleId: v2.id,
      technicianId: tech.id,
      status: 'REPAIR',
      priority: 'HIGH',
      description: 'Engine overheating - coolant leak suspected.',
      estimatedCost: 35000,
      mileageAtService: 78200,
      statusHistory: {
        create: [
          { status: 'INTAKE', notes: 'Vehicle received', changedBy: admin.id },
          { status: 'DIAGNOSIS', notes: 'Coolant leak found', changedBy: tech.id },
          { status: 'REPAIR', notes: 'Replacing hoses', changedBy: tech.id },
        ],
      },
    },
  });

  await prisma.jobCard.create({
    data: {
      jobNumber: 'JC-2401-1002',
      vehicleId: v1.id,
      technicianId: tech.id,
      status: 'COMPLETED',
      priority: 'NORMAL',
      description: 'Brake service - front pads worn.',
      estimatedCost: 12000,
      actualCost: 11300,
      completionDate: new Date(),
      mileageAtService: 44500,
      statusHistory: {
        create: [
          { status: 'INTAKE', notes: 'Brake inspection' },
          { status: 'REPAIR', notes: 'Replacing front pads' },
          { status: 'COMPLETED', notes: 'Vehicle ready' },
        ],
      },
    },
  });

  await prisma.part.upsert({
    where: { partNumber: 'OIL-5W30' },
    update: {},
    create: { partNumber: 'OIL-5W30', name: 'Engine Oil 5W-30', category: 'Lubricants', unitCost: 850, quantity: 50, minimumStock: 20, supplier: 'TotalEnergies' },
  });

  await prisma.part.upsert({
    where: { partNumber: 'FLT-OIL-001' },
    update: {},
    create: { partNumber: 'FLT-OIL-001', name: 'Oil Filter', category: 'Filters', unitCost: 650, quantity: 30, minimumStock: 15, supplier: 'Toyota Kenya' },
  });

  await prisma.part.upsert({
    where: { partNumber: 'BRK-PAD-FR' },
    update: {},
    create: { partNumber: 'BRK-PAD-FR', name: 'Front Brake Pads', category: 'Brakes', unitCost: 3500, quantity: 15, minimumStock: 8, supplier: 'Brembo' },
  });

  await prisma.part.upsert({
    where: { partNumber: 'BTY-12V-75' },
    update: {},
    create: { partNumber: 'BTY-12V-75', name: 'Battery 12V 75Ah', category: 'Electrical', unitCost: 9500, quantity: 3, minimumStock: 4, supplier: 'Chloride Exide' },
  });

  console.log('Database seeded successfully!');
  console.log('Login: admin@gms.com / Admin@1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());