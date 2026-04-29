import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobCardApi, vehicleApi, userApi } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Loader2, X } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  INTAKE:    { color: '#64748b', bg: '#64748b20' },
  DIAGNOSIS: { color: '#8b5cf6', bg: '#8b5cf620' },
  REPAIR:    { color: '#f59e0b', bg: '#f59e0b20' },
  TESTING:   { color: '#0ea5e9', bg: '#0ea5e920' },
  COMPLETED: { color: '#10b981', bg: '#10b98120' },
  CANCELLED: { color: '#ef4444', bg: '#ef444420' },
};

export default function JobCards() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', technicianId: '', description: '', priority: 'NORMAL', estimatedCost: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['job-cards', search],
    queryFn: () => jobCardApi.getAll({ search: search || undefined }),
  });
  const { data: vehiclesRes } = useQuery({ queryKey: ['vehicles-all'], queryFn: () => vehicleApi.getAll({ limit: 100 }) });
  const { data: techRes } = useQuery({ queryKey: ['technicians'], queryFn: userApi.getTechnicians });

  const createMut = useMutation({
    mutationFn: jobCardApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-cards'] }); toast.success('Job card created'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const jobCards = data?.data?.data || [];
  const vehicles = vehiclesRes?.data?.data || [];
  const technicians = techRes?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Job Cards</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Job Card</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input className="input-field pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobCards.map((jc: any) => {
            const sc = STATUS_CONFIG[jc.status] || STATUS_CONFIG.INTAKE;
            return (
              <div key={jc.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>{jc.jobNumber}</span>
                  <span className="badge" style={{ background: sc.bg, color: sc.color }}>{jc.status}</span>
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {jc.vehicle?.plateNumber} — {jc.vehicle?.make} {jc.vehicle?.model}
                </p>
                <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{jc.description}</p>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>{jc.technician?.name || 'Unassigned'}</span>
                  <span style={{ color: jc.priority === 'URGENT' ? '#ef4444' : jc.priority === 'HIGH' ? '#f59e0b' : 'var(--text-secondary)' }}>{jc.priority}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>New Job Card</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Vehicle *</label>
                <select className="input-field" required value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Technician</label>
                <select className="input-field" value={form.technicianId} onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {technicians.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Description *</label>
                <textarea className="input-field" rows={3} required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                  <select className="input-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Est. Cost (KES)</label>
                  <input type="number" className="input-field" value={form.estimatedCost} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {createMut.isPending && <Loader2 size={14} className="animate-spin" />} Create
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