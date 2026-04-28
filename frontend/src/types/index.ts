export type Role = 'ADMIN' | 'WORKSHOP_STAFF' | 'MANAGER';
export type VehicleStatus = 'AVAILABLE' | 'IN_SERVICE' | 'UNDER_REPAIR' | 'OUT_OF_SERVICE';
export type JobCardStatus = 'INTAKE' | 'DIAGNOSIS' | 'REPAIR' | 'TESTING' | 'COMPLETED' | 'CANCELLED';
export type TransactionType = 'IN' | 'OUT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  mileage: number;
  assignedDriver?: string;
  status: VehicleStatus;
  fuelType?: string;
  notes?: string;
  createdAt: string;
  _count?: { jobCards: number };
}

export interface JobCard {
  id: string;
  jobNumber: string;
  vehicleId: string;
  technicianId?: string;
  createdById: string;
  status: JobCardStatus;
  priority: string;
  description: string;
  diagnosis?: string;
  workDone?: string;
  estimatedCost?: number;
  actualCost?: number;
  mileageIn?: number;
  mileageOut?: number;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  vehicle?: { plateNumber: string; make: string; model: string };
  technician?: { name: string; id?: string; email?: string };
  createdBy?: { name: string };
  repairs?: Repair[];
  statusLogs?: StatusLog[];
  _count?: { repairs: number };
}

export interface Repair {
  id: string;
  jobCardId: string;
  description: string;
  laborCost: number;
  notes?: string;
  createdAt: string;
  parts?: RepairPart[];
}

export interface RepairPart {
  id: string;
  repairId: string;
  partId: string;
  quantity: number;
  unitCost: number;
  part?: Part;
}

export interface Part {
  id: string;
  partNumber?: string;
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  unitPrice?: number;
  supplier?: string;
  location?: string;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  partId: string;
  type: TransactionType;
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface StatusLog {
  id: string;
  jobCardId: string;
  status: JobCardStatus;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalVehicles: number;
  vehiclesByStatus: Record<VehicleStatus, number>;
  activeJobCards: number;
  jobCardsByStatus: Record<JobCardStatus, number>;
  completedThisMonth: number;
  totalParts: number;
  lowStockParts: number;
  recentJobCards: JobCard[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total: number; page: number; limit: number };
}
