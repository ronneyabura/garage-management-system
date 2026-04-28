import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users as UsersIcon, Shield, Wrench, BarChart3, UserCheck, UserX, Plus } from 'lucide-react';
import { userApi, authApi } from '../services/api';
import { User, Role } from '../types';
import { Modal } from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const roleIcons: Record<Role, React.ElementType> = {
  ADMIN: Shield,
  WORKSHOP_STAFF: Wrench,
  MANAGER: BarChart3,
};

const roleColors: Record<Role, string> = {
  ADMIN: 'text-red-400 bg-red-500/10 border-red-500/20',
  WORKSHOP_STAFF: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  MANAGER: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

const CreateUserForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: 'password123', role: 'WORKSHOP_STAFF', phone: '' });

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.register(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error creating user'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: 'Full Name *', key: 'name', required: true },
        { label: 'Email *', key: 'email', type: 'email', required: true },
        { label: 'Password *', key: 'password', type: 'password', required: true },
        { label: 'Phone', key: 'phone' },
      ].map(({ label, key, type = 'text', required }) => (
        <div key={key}>
          <label className="label">{label}</label>
          <input type={type} required={required} className="input" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <div>
        <label className="label">Role *</label>
        <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="WORKSHOP_STAFF">Workshop Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">{mutation.isPending ? 'Creating...' : 'Create User'}</button>
      </div>
    </form>
  );
};

export const Users: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll().then(r => r.data.data),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => userApi.update(id, { active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); },
  });

  if (isLoading) return <PageLoader />;

  const users: User[] = data || [];
  const roleCount = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Users</h1>
          <p className="text-slate-400">System access and role management — {users.length} users</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Add User</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['ADMIN', 'MANAGER', 'WORKSHOP_STAFF'] as Role[]).map((role) => {
          const Icon = roleIcons[role];
          return (
            <div key={role} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${roleColors[role]}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{roleCount[role] || 0}</div>
                <div className="text-slate-400 text-xs">{role.replace('_', ' ')}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['User', 'Email', 'Role', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const Icon = roleIcons[user.role];
              return (
                <tr key={user.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center text-sky-400 text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-200 text-sm">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${roleColors[user.role]}`}>
                      <Icon size={11} />{user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{format(new Date(user.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${user.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: user.id, active: !user.active })}
                      className={`p-1.5 rounded-lg transition-colors ${user.active ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                      title={user.active ? 'Deactivate' : 'Activate'}
                    >
                      {user.active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
        <CreateUserForm onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
};
