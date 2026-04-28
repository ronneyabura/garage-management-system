import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { inventoryApi } from '../services/api';
import { Part } from '../types';
import { Modal } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const PartForm: React.FC<{ part?: Part; onClose: () => void }> = ({ part, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    partNumber: part?.partNumber || '',
    name: part?.name || '',
    description: part?.description || '',
    category: part?.category || '',
    quantity: part?.quantity?.toString() || '0',
    minQuantity: part?.minQuantity?.toString() || '5',
    unitCost: part?.unitCost?.toString() || '',
    unitPrice: part?.unitPrice?.toString() || '',
    supplier: part?.supplier || '',
    location: part?.location || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => part ? inventoryApi.update(part.id, data) : inventoryApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); toast.success(part ? 'Part updated' : 'Part created'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving part'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      quantity: parseInt(form.quantity),
      minQuantity: parseInt(form.minQuantity),
      unitCost: parseFloat(form.unitCost),
      unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Part Number', key: 'partNumber' },
          { label: 'Part Name *', key: 'name', required: true },
          { label: 'Category', key: 'category' },
          { label: 'Supplier', key: 'supplier' },
          { label: 'Unit Cost (KES) *', key: 'unitCost', type: 'number', required: true },
          { label: 'Unit Price (KES)', key: 'unitPrice', type: 'number' },
          { label: 'Current Qty', key: 'quantity', type: 'number' },
          { label: 'Min Qty Alert', key: 'minQuantity', type: 'number' },
          { label: 'Storage Location', key: 'location' },
        ].map(({ label, key, type = 'text', required }) => (
          <div key={key} className={key === 'location' ? 'col-span-2' : ''}>
            <label className="label">{label}</label>
            <input
              type={type}
              required={required}
              className="input"
              value={(form as any)[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">{mutation.isPending ? 'Saving...' : part ? 'Update' : 'Add Part'}</button>
      </div>
    </form>
  );
};

const TransactionModal: React.FC<{ part: Part; onClose: () => void }> = ({ part, onClose }) => {
  const qc = useQueryClient();
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => inventoryApi.addTransaction(part.id, { type, quantity: parseInt(quantity), notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); toast.success(`Stock ${type === 'IN' ? 'added' : 'removed'}`); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="font-medium text-white">{part.name}</div>
        <div className="text-slate-400 text-sm">Current stock: <span className="text-white font-mono">{part.quantity}</span> units</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(['IN', 'OUT'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`p-3 rounded-xl border flex items-center gap-2 justify-center text-sm font-medium transition-all ${type === t ? (t === 'IN' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400') : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
          >
            {t === 'IN' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
            Stock {t}
          </button>
        ))}
      </div>
      <div>
        <label className="label">Quantity</label>
        <input type="number" min="1" className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Purchase order, reason, etc..." />
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()} className="btn-primary flex-1">
          {mutation.isPending ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
};

export const Inventory: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPart, setEditPart] = useState<Part | undefined>();
  const [txnPart, setTxnPart] = useState<Part | null>(null);

  const { data: lowStock } = useQuery({ queryKey: ['low-stock'], queryFn: () => inventoryApi.getLowStock().then(r => r.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['parts', search],
    queryFn: () => inventoryApi.getAll({ search: search || undefined, limit: 100 }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); toast.success('Part deleted'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Inventory</h1>
          <p className="text-slate-400">Spare parts management — {data?.meta?.total || 0} parts</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Add Part</button>
      </div>

      {lowStock?.count > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-amber-400 w-5 h-5 flex-shrink-0" />
          <div>
            <span className="text-amber-400 font-medium">{lowStock.count} parts below minimum stock level</span>
            <div className="text-amber-400/70 text-sm mt-0.5">{lowStock.data.map((p: Part) => p.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input className="input pl-9" placeholder="Search parts..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {!data?.data?.length ? (
            <EmptyState icon={Package} title="No parts found" description="Start adding spare parts to your inventory" action={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Add Part</button>} />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Part #', 'Name', 'Category', 'Qty', 'Min Qty', 'Unit Cost', 'Supplier', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((p: Part) => {
                  const isLow = p.quantity <= p.minQuantity;
                  return (
                    <tr key={p.id} className={`table-row ${isLow ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.partNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200 text-sm">{p.name}</div>
                        {p.description && <div className="text-slate-500 text-xs truncate max-w-[150px]">{p.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{p.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm font-medium ${isLow ? 'text-amber-400' : 'text-white'}`}>
                          {p.quantity} {isLow && <AlertTriangle size={12} className="inline ml-1" />}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-sm">{p.minQuantity}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 text-sm">KES {p.unitCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{p.supplier || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setTxnPart(p)} title="Stock transaction" className="p-1.5 hover:bg-sky-500/10 rounded-lg transition-colors text-slate-400 hover:text-sky-400">
                            <ArrowDown size={14} />
                          </button>
                          <button onClick={() => { setEditPart(p); setShowModal(true); }} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { if (confirm('Delete this part?')) deleteMutation.mutate(p.id); }} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditPart(undefined); }} title={editPart ? 'Edit Part' : 'Add New Part'} size="lg">
        <PartForm part={editPart} onClose={() => { setShowModal(false); setEditPart(undefined); }} />
      </Modal>

      {txnPart && (
        <Modal isOpen={!!txnPart} onClose={() => setTxnPart(null)} title="Stock Transaction">
          <TransactionModal part={txnPart} onClose={() => setTxnPart(null)} />
        </Modal>
      )}
    </div>
  );
};
