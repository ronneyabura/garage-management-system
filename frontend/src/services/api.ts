import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gms_token');
      localStorage.removeItem('gms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Vehicles
export const vehicleApi = {
  getAll: (params?: any) => api.get('/vehicles', { params }),
  getOne: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  getHistory: (id: string) => api.get(`/vehicles/${id}/history`),
  getDowntime: () => api.get('/vehicles/downtime'),
};

// Job Cards
export const jobCardApi = {
  getAll: (params?: any) => api.get('/job-cards', { params }),
  getOne: (id: string) => api.get(`/job-cards/${id}`),
  create: (data: any) => api.post('/job-cards', data),
  update: (id: string, data: any) => api.patch(`/job-cards/${id}`, data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/job-cards/${id}/status`, { status, notes }),
  addRepair: (id: string, data: any) => api.post(`/job-cards/${id}/repairs`, data),
};

// Inventory
export const inventoryApi = {
  getAll: (params?: any) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getOne: (id: string) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.patch(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  addTransaction: (id: string, data: any) => api.post(`/inventory/${id}/transactions`, data),
  getTransactions: (id: string) => api.get(`/inventory/${id}/transactions`),
};

// Reports
export const reportApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getMaintenanceCost: (params?: any) => api.get('/reports/maintenance-cost', { params }),
  getRepairFrequency: () => api.get('/reports/repair-frequency'),
  getPartsConsumption: () => api.get('/reports/parts-consumption'),
};

// Users
export const userApi = {
  getAll: () => api.get('/users'),
  getTechnicians: () => api.get('/users/technicians'),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
};

// Integrations
export const integrationApi = {
  syncFromERP: () => api.post('/integrations/erp/sync'),
  syncInventory: () => api.post('/integrations/inventory/sync'),
  exportToERP: () => api.post('/integrations/erp/export-jobs'),
};
