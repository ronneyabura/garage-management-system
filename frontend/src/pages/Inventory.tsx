import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

const emptyForm = { partNumber: '', name: '', category: '', unitCost: 0, quantity: 0, minimumStock: 5, supplier: '', unit: 'piece' };

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search],
    queryFn: () => inventoryApi.getAll({ search: search || undefined }),
  });
  const { data: summaryRes } = useQuery({ queryKey: ['inv-summary'], queryFn: inventoryApi.getSummary });

  const createMut = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Part added'); setShowModal(false); setForm(emptyForm); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => inventoryApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Part updated'); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: inventoryApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Part deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const parts = data?.data?.data || [];
  const summary = summaryRes?.data?.data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Inventory</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {summary?.totalParts ?? 0} parts · KES {summary?.totalValue?.toLocaleString() ?? 0} value · {summary?.lowStockCount ?? 0} low stock
          </p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Part
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input className="input-field pl-9" placeholder="Search parts..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Part #', 'Name', 'Category', 'Stock', 'Unit Cost', 'Supplier', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12"><Loader2 className="animate-spin mx-auto" style={{ color: 'var(--accent)' }} /></td></tr>
            ) : parts.map((p: any) => (
              <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--accent)' }}>{p.partNumber}</td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.category || '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-sm" style={{ color: p.quantity <= p.minimumStock ? '#ef4444' : '#10b981' }}>{p.quantity}</span>
                  {p.quantity <= p.minimumStock && <AlertTriangle size={12} className="inline ml-1" style={{ color: '#f59e0b' }} />}
                </td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>KES {p.unitCost?.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.supplier || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(p); setForm({ ...p }); setShowModal(true); }} style={{ color: 'var(--text-secondary)' }}><Edit2 size={15} /></button>
                    <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(p.id); }} style={{ color: 'var(--text-secondary)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="card w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="font-display font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>{editing ? 'Edit Part' : 'Add Part'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[['Part Number', 'partNumber'], ['Name', 'name'], ['Category', 'category'], ['Supplier', 'supplier'], ['Unit', 'unit']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input className="input-field" value={form[key]} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              {[['Unit Cost', 'unitCost'], ['Quantity', 'quantity'], ['Min Stock', 'minimumStock']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                  <input type="number" className="input-field" value={form[key]} onChange={e => setForm((f: any) => ({ ...f, [key]: Number(e.target.value) }))} />
                </div>
              ))}
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'Save' : 'Add Part'}
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