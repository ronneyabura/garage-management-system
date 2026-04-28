import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Truck, Edit2, Trash2, Eye, Fuel, User } from 'lucide-react';
import { vehicleApi } from '../services/api';
import { Vehicle, VehicleStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const statusOptions: VehicleStatus[] = ['AVAILABLE', 'IN_SERVICE', 'UNDER_REPAIR', 'OUT_OF_SERVICE'];

const VehicleForm: React.FC<{ vehicle?: Vehicle; onClose: () => void }> = ({ vehicle, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    plateNumber: vehicle?.plateNumber || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year?.toString() || new Date().getFullYear().toString(),
    color: vehicle?.color || '',
    mileage: vehicle?.mileage?.toString() || '0',
    assignedDriver: vehicle?.assignedDriver || '',
    fuelType: vehicle?.fuelType || 'Diesel',
    status: vehicle?.status || 'AVAILABLE',
    notes: vehicle?.notes || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => vehicle ? vehicleApi.update(vehicle.id, data) : vehicleApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(vehicle ? 'Vehicle updated' : 'Vehicle created');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving vehicle'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...form, year: parseInt(form.year), mileage: parseInt(form.mileage) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Plate Number', key: 'plateNumber', required: true },
          { label: 'Make', key: 'make', required: true },
          { label: 'Model', key: 'model', required: true },
          { label: 'Year', key: 'year', type: 'number', required: true },
          { label: 'Color', key: 'color' },
          { label: 'Mileage (km)', key: 'mileage', type: 'number' },
          { label: 'Assigned Driver', key: 'assignedDriver' },
          { label: 'Fuel Type', key: 'fuelType' },
        ].map(({ label, key, type = 'text', required }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              type={type}
              className="input"
              required={required}
              value={(form as any)[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      {vehicle && (
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
            {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
          {mutation.isPending ? 'Saving...' : vehicle ? 'Update' : 'Create Vehicle'}
        </button>
      </div>
    </form>
  );
};

export const Vehicles: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, statusFilter],
    queryFn: () => vehicleApi.getAll({ search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: vehicleApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle deleted'); },
    onError: () => toast.error('Cannot delete vehicle with job history'),
  });

  const handleEdit = (v: Vehicle) => { setEditVehicle(v); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setEditVehicle(undefined); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Vehicles</h1>
          <p className="text-slate-400">Manage your fleet — {data?.meta?.total || 0} vehicles total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            className="input pl-9"
            placeholder="Search plate, make, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {!data?.data?.length ? (
            <EmptyState icon={Truck} title="No vehicles found" description="Add your first fleet vehicle to get started" action={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Add Vehicle</button>} />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Plate Number', 'Make / Model', 'Year', 'Driver', 'Mileage', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((v: Vehicle) => (
                  <tr key={v.id} className="table-row">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-sky-400 font-medium">{v.plateNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{v.make} {v.model}</div>
                      {v.fuelType && <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Fuel size={10} />{v.fuelType}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{v.year}</td>
                    <td className="px-4 py-3">
                      {v.assignedDriver ? (
                        <div className="flex items-center gap-1 text-slate-300 text-sm">
                          <User size={12} className="text-slate-500" />{v.assignedDriver}
                        </div>
                      ) : <span className="text-slate-600 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{v.mileage?.toLocaleString()} km</td>
                    <td className="px-4 py-3"><StatusBadge type="vehicle" status={v.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(v)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this vehicle?')) deleteMutation.mutate(v.id); }}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleClose} title={editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'} size="lg">
        <VehicleForm vehicle={editVehicle} onClose={handleClose} />
      </Modal>
    </div>
  );
};
