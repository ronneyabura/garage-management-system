import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ClipboardList, ChevronRight, Calendar, User, DollarSign } from 'lucide-react';
import { jobCardApi, vehicleApi, userApi } from '../services/api';
import { JobCard, JobCardStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const statusOptions: JobCardStatus[] = ['INTAKE', 'DIAGNOSIS', 'REPAIR', 'TESTING', 'COMPLETED', 'CANCELLED'];

const statusFlow: Record<string, string[]> = {
  INTAKE: ['DIAGNOSIS', 'CANCELLED'],
  DIAGNOSIS: ['REPAIR', 'CANCELLED'],
  REPAIR: ['TESTING', 'CANCELLED'],
  TESTING: ['COMPLETED', 'REPAIR'],
  COMPLETED: [],
  CANCELLED: [],
};

const CreateJobCardForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    vehicleId: '', technicianId: '', description: '', priority: 'NORMAL',
    mileageIn: '', estimatedCost: '', scheduledDate: '',
  });

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-all'], queryFn: () => vehicleApi.getAll({ limit: 100 }).then(r => r.data.data) });
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: () => userApi.getTechnicians().then(r => r.data.data) });

  const mutation = useMutation({
    mutationFn: jobCardApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-cards'] }); toast.success('Job card created'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error creating job card'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      mileageIn: form.mileageIn ? parseInt(form.mileageIn) : undefined,
      estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
      technicianId: form.technicianId || undefined,
      scheduledDate: form.scheduledDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Vehicle *</label>
        <select className="input" required value={form.vehicleId} onChange={(e) => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
          <option value="">Select a vehicle</option>
          {vehicles?.map((v: any) => (
            <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assigned Technician</label>
          <select className="input" value={form.technicianId} onChange={(e) => setForm(f => ({ ...f, technicianId: e.target.value }))}>
            <option value="">Unassigned</option>
            {technicians?.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}>
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Mileage In (km)</label>
          <input type="number" className="input" value={form.mileageIn} onChange={(e) => setForm(f => ({ ...f, mileageIn: e.target.value }))} />
        </div>
        <div>
          <label className="label">Estimated Cost (KES)</label>
          <input type="number" className="input" value={form.estimatedCost} onChange={(e) => setForm(f => ({ ...f, estimatedCost: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="label">Description / Work Required *</label>
        <textarea required className="input" rows={3} placeholder="Describe the issue or service required..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
          {mutation.isPending ? 'Creating...' : 'Create Job Card'}
        </button>
      </div>
    </form>
  );
};

const UpdateStatusModal: React.FC<{ jobCard: JobCard; onClose: () => void }> = ({ jobCard, onClose }) => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const allowed = statusFlow[jobCard.status] || [];

  const mutation = useMutation({
    mutationFn: () => jobCardApi.updateStatus(jobCard.id, status, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-cards'] }); toast.success('Status updated'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error updating status'),
  });

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-1">Current Status</div>
        <StatusBadge type="job" status={jobCard.status} />
      </div>
      {allowed.length === 0 ? (
        <p className="text-slate-400 text-sm">This job card cannot be transitioned further.</p>
      ) : (
        <>
          <div>
            <label className="label">New Status</label>
            <div className="grid grid-cols-2 gap-2">
              {allowed.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${status === s ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  <StatusBadge type="job" status={s} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add transition notes..." />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button
              type="button"
              disabled={!status || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const JobCards: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [statusModal, setStatusModal] = useState<JobCard | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['job-cards', search, statusFilter],
    queryFn: () => jobCardApi.getAll({ search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Job Cards</h1>
          <p className="text-slate-400">Repair workflow management — {data?.meta?.total || 0} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Job Card
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="input pl-9" placeholder="Search job number, plate, description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {!data?.data?.length ? (
            <EmptyState icon={ClipboardList} title="No job cards found" description="Create a new job card to start tracking repairs" action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />New Job Card</button>} />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Job #', 'Vehicle', 'Description', 'Technician', 'Priority', 'Status', 'Cost', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((jc: JobCard) => (
                  <tr key={jc.id} className="table-row">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-sky-400">{jc.jobNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200 text-sm">{jc.vehicle?.plateNumber}</div>
                      <div className="text-slate-500 text-xs">{jc.vehicle?.make} {jc.vehicle?.model}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 text-sm max-w-[180px] truncate" title={jc.description}>{jc.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      {jc.technician ? (
                        <div className="flex items-center gap-1 text-slate-300 text-sm">
                          <User size={12} className="text-slate-500" />{jc.technician.name}
                        </div>
                      ) : <span className="text-slate-600 text-sm">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge type="priority" status={jc.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge type="job" status={jc.status} /></td>
                    <td className="px-4 py-3">
                      {jc.actualCost ? (
                        <span className="text-emerald-400 text-sm font-mono">KES {jc.actualCost.toLocaleString()}</span>
                      ) : jc.estimatedCost ? (
                        <span className="text-slate-400 text-sm font-mono">~{jc.estimatedCost.toLocaleString()}</span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDistanceToNow(new Date(jc.createdAt), { addSuffix: true })}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setStatusModal(jc)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg transition-colors"
                      >
                        Update <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Job Card" size="lg">
        <CreateJobCardForm onClose={() => setShowCreate(false)} />
      </Modal>

      {statusModal && (
        <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} title={`Update Status — ${statusModal.jobNumber}`}>
          <UpdateStatusModal jobCard={statusModal} onClose={() => setStatusModal(null)} />
        </Modal>
      )}
    </div>
  );
};
