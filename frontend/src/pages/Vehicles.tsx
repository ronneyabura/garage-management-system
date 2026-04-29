import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleApi } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  AVAILABLE:      { color: '#10b981', bg: '#10b98120', label: 'Available' },
  IN_SERVICE:     { color: '#0ea5e9', bg: '#0ea5e920', label: 'In Service' },
  UNDER_REPAIR:   { color: '#f59e0b', bg: '#f59e0b20', label: 'Under Repair' },
  OUT_OF_SERVICE: { color: '#ef4444', bg: '#ef444420', label: 'Out of Service' },
};

const emptyForm = { plateNumber: '', make: '', model: '', year: 2020, color: '', vin: '', assignedDriver: '', status: 'AVAILABLE', mileage: 0, fuelType: 'Diesel' };

export default function Vehicles() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search],
    queryFn: () => vehicleApi.getAll({ search: search || undefined }),
  });

  const createMut = useMutation({
    mutationFn: vehicleApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle added'); setShowModal(false); setForm(emptyForm); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => vehicleApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle updated'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMut = useMutation({
    mutationFn: vehicleApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const vehicles = data?.data?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const openEdit = (v: any) => { setEditing(v); setForm({ ...v }); setShowModal(true); };
  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Fleet Management</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Vehicle</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input className="input-field pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Plate', 'Vehicle', 'Driver', 'Status', 'Mileage', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: 'var(--accent)' }} /></td></tr>
            ) : vehicles.map((v: any) => {
              const sc = STATUS_CONFIG[v.status] || STATUS_CONFIG.AVAILABLE;
              return (
                <tr key={v.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>{v.plateNumber}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{v.make} {v.model} ({v.year})</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{v.assignedDriver || '—'}</td>
                  <td className="px-4 py-3"><span className="badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span></td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{v.mileage?.toLocaleString()} km</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(v)} style={{ color: 'var(--text-secondary)' }}><Edit2 size={15} /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(v.id); }} style={{ color: 'var(--text-secondary)' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="card w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="font-display font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[['Plate Number', 'plateNumber'], ['Make', 'make'], ['Model', 'model'], ['Color', 'color'], ['VIN', 'vin'], ['Driver', 'assignedDriver']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input className="input-field" value={form[key]} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Year</label>
                <input type="number" className="input-field" value={form.year} onChange={e => setForm((f: any) => ({ ...f, year: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Mileage</label>
                <input type="number" className="input-field" value={form.mileage} onChange={e => setForm((f: any) => ({ ...f, mileage: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <select className="input-field" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Fuel Type</label>
                <select className="input-field" value={form.fuelType} onChange={e => setForm((f: any) => ({ ...f, fuelType: e.target.value }))}>
                  {['Diesel', 'Petrol', 'Electric', 'Hybrid'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'Save Changes' : 'Add Vehicle'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}