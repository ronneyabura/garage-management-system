import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Wrench, Clock, User, DollarSign, CheckCircle,
  AlertTriangle, Plus, ChevronRight, Package
} from 'lucide-react';
import { jobCardApi, inventoryApi } from '../services/api';
import { JobCard, Part, StatusLog } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const statusOrder = ['INTAKE', 'DIAGNOSIS', 'REPAIR', 'TESTING', 'COMPLETED'];

const AddRepairForm: React.FC<{ jobCardId: string; onClose: () => void }> = ({ jobCardId, onClose }) => {
  const qc = useQueryClient();
  const [description, setDescription] = useState('');
  const [laborCost, setLaborCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [selectedParts, setSelectedParts] = useState<Array<{ partId: string; quantity: number; unitCost: number }>>([]);

  const { data: partsData } = useQuery({
    queryKey: ['parts-list'],
    queryFn: () => inventoryApi.getAll({ limit: 100 }).then(r => r.data.data),
  });

  const addPart = () => setSelectedParts(p => [...p, { partId: '', quantity: 1, unitCost: 0 }]);
  const removePart = (i: number) => setSelectedParts(p => p.filter((_, idx) => idx !== i));
  const updatePart = (i: number, field: string, value: any) => {
    setSelectedParts(p => p.map((part, idx) => {
      if (idx !== i) return part;
      const updated = { ...part, [field]: value };
      if (field === 'partId') {
        const found = partsData?.find((pt: Part) => pt.id === value);
        if (found) updated.unitCost = found.unitCost;
      }
      return updated;
    }));
  };

  const mutation = useMutation({
    mutationFn: (data: any) => jobCardApi.addRepair(jobCardId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-card', jobCardId] }); toast.success('Repair added'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error adding repair'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      description,
      laborCost: parseFloat(laborCost),
      notes,
      parts: selectedParts.filter(p => p.partId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Repair Description *</label>
        <textarea required className="input" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the work performed..." />
      </div>
      <div>
        <label className="label">Labour Cost (KES)</label>
        <input type="number" className="input" value={laborCost} onChange={e => setLaborCost(e.target.value)} />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Parts Used</label>
          <button type="button" onClick={addPart} className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300">
            <Plus size={12} /> Add Part
          </button>
        </div>
        {selectedParts.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-3 border border-dashed border-slate-700 rounded-lg">No parts added yet</p>
        )}
        <div className="space-y-2">
          {selectedParts.map((p, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <select className="input text-xs" value={p.partId} onChange={e => updatePart(i, 'partId', e.target.value)}>
                  <option value="">Select part</option>
                  {partsData?.map((pt: Part) => (
                    <option key={pt.id} value={pt.id}>{pt.name} (Qty: {pt.quantity})</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <input type="number" min="1" className="input text-xs" placeholder="Qty" value={p.quantity} onChange={e => updatePart(i, 'quantity', parseInt(e.target.value))} />
              </div>
              <div className="col-span-4">
                <input type="number" className="input text-xs" placeholder="Unit Cost" value={p.unitCost} onChange={e => updatePart(i, 'unitCost', parseFloat(e.target.value))} />
              </div>
              <button type="button" onClick={() => removePart(i)} className="col-span-1 text-red-400 hover:text-red-300 text-xs p-1">✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
          {mutation.isPending ? 'Saving...' : 'Add Repair'}
        </button>
      </div>
    </form>
  );
};

export const JobCardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showRepairModal, setShowRepairModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['job-card', id],
    queryFn: () => jobCardApi.getOne(id!).then(r => r.data.data),
  });

  const jc: JobCard | undefined = data;

  if (isLoading) return <PageLoader />;
  if (!jc) return <div className="text-slate-400">Job card not found</div>;

  const currentStep = statusOrder.indexOf(jc.status);
  const totalLaborCost = jc.repairs?.reduce((s, r) => s + r.laborCost, 0) || 0;
  const totalPartsCost = jc.repairs?.reduce((s, r) =>
    s + (r.parts?.reduce((ps, p) => ps + p.unitCost * p.quantity, 0) || 0), 0) || 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/job-cards')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-3xl font-bold text-white">{jc.jobNumber}</h1>
            <StatusBadge type="job" status={jc.status} />
            <StatusBadge type="priority" status={jc.priority} />
          </div>
          <p className="text-slate-400">{jc.vehicle?.make} {jc.vehicle?.model} — {jc.vehicle?.plateNumber}</p>
        </div>
        <button onClick={() => setShowRepairModal(true)} className="btn-primary">
          <Plus size={16} /> Add Repair
        </button>
      </div>

      {/* Progress Stepper */}
      {jc.status !== 'CANCELLED' && (
        <div className="card p-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-5">Workflow Progress</h3>
          <div className="flex items-center">
            {statusOrder.map((step, i) => {
              const done = i < currentStep || jc.status === 'COMPLETED';
              const active = i === currentStep && jc.status !== 'COMPLETED';
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      done || jc.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' :
                      active ? 'bg-sky-500/20 border-sky-500 text-sky-400' :
                      'bg-slate-800 border-slate-600 text-slate-600'
                    }`}>
                      {done || jc.status === 'COMPLETED' ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${active ? 'text-sky-400' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {i < statusOrder.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStep || jc.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Details */}
        <div className="col-span-2 space-y-6">
          {/* Info card */}
          <div className="card p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-lg">Job Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Description</label>
                <p className="text-slate-300 text-sm">{jc.description}</p>
              </div>
              {jc.diagnosis && (
                <div>
                  <label className="label">Diagnosis</label>
                  <p className="text-slate-300 text-sm">{jc.diagnosis}</p>
                </div>
              )}
              {jc.workDone && (
                <div className="col-span-2">
                  <label className="label">Work Done</label>
                  <p className="text-slate-300 text-sm">{jc.workDone}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-700/50">
              {[
                { label: 'Technician', value: jc.technician?.name || 'Unassigned', icon: User },
                { label: 'Mileage In', value: jc.mileageIn ? `${jc.mileageIn.toLocaleString()} km` : '—', icon: null },
                { label: 'Created', value: format(new Date(jc.createdAt), 'dd MMM yyyy'), icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <label className="label">{label}</label>
                  <p className="text-slate-300 text-sm flex items-center gap-1">
                    {Icon && <Icon size={13} className="text-slate-500" />}
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Repairs */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white text-lg">Repairs & Parts</h3>
              <button onClick={() => setShowRepairModal(true)} className="btn-secondary text-xs py-1.5">
                <Plus size={13} /> Add
              </button>
            </div>
            {!jc.repairs?.length ? (
              <div className="text-center py-8 text-slate-500">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No repairs logged yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jc.repairs.map((repair) => (
                  <div key={repair.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-slate-200">{repair.description}</p>
                        {repair.notes && <p className="text-slate-500 text-xs mt-1">{repair.notes}</p>}
                      </div>
                      <span className="font-mono text-sm text-sky-400">Labour: KES {repair.laborCost.toLocaleString()}</span>
                    </div>
                    {repair.parts && repair.parts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Package size={11} />Parts Used</p>
                        <div className="space-y-1">
                          {repair.parts.map((rp) => (
                            <div key={rp.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">{rp.part?.name} × {rp.quantity}</span>
                              <span className="font-mono text-slate-300">KES {(rp.unitCost * rp.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Cost summary */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-white mb-4">Cost Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Labour</span>
                <span className="text-slate-200 font-mono">KES {totalLaborCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Parts</span>
                <span className="text-slate-200 font-mono">KES {totalPartsCost.toLocaleString()}</span>
              </div>
              {jc.estimatedCost && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Estimated</span>
                  <span className="text-slate-500 font-mono">KES {jc.estimatedCost.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-700 flex justify-between">
                <span className="font-medium text-slate-200">Total</span>
                <span className="font-bold text-emerald-400 font-mono">KES {(jc.actualCost || totalLaborCost + totalPartsCost).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-white mb-4">Status Timeline</h3>
            <div className="space-y-3">
              {jc.statusLogs?.map((log: StatusLog, i: number) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                    {i < (jc.statusLogs?.length || 0) - 1 && <div className="w-px flex-1 bg-slate-700 mt-1" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <StatusBadge type="job" status={log.status} />
                    {log.notes && <p className="text-slate-500 text-xs mt-1">{log.notes}</p>}
                    <p className="text-slate-600 text-xs mt-1">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showRepairModal} onClose={() => setShowRepairModal(false)} title="Log Repair Work" size="lg">
        <AddRepairForm jobCardId={id!} onClose={() => setShowRepairModal(false)} />
      </Modal>
    </div>
  );
};
