export type VehicleStatus =
  | 'AVAILABLE'
  | 'IN_SERVICE'
  | 'UNDER_REPAIR'
  | 'OUT_OF_SERVICE';

export type JobCardStatus =
  | 'INTAKE'
  | 'DIAGNOSIS'
  | 'REPAIR'
  | 'TESTING'
  | 'COMPLETED'
  | 'CANCELLED';

export type Role = 'ADMIN' | 'MANAGER' | 'WORKSHOP_STAFF';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  assignedDriver?: string;
  status: VehicleStatus;
  mileage: number;
  fuelType?: string;
}

export interface JobCard {
  id: string;
  jobNumber: string;
  vehicleId: string;
  technicianId?: string;
  status: JobCardStatus;
  priority: Priority;
  description: string;
  estimatedCost?: number;
  actualCost?: number;
  intakeDate: string;
  completionDate?: string;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  category?: string;
  unitCost: number;
  quantity: number;
  minimumStock: number;
  supplier?: string;
}