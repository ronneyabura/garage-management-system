import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  BarChart3, TrendingDown, Package, Wrench,
  Download, RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react';
import { reportApi, integrationApi } from '../services/api';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#f1f5f9' },
};

const TabBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string }> = ({
  active, onClick, icon: Icon, label
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`}
  >
    <Icon size={15} />
    {label}
  </button>
);

export const Reports: React.FC = () => {
  const [tab, setTab] = useState<'cost' | 'frequency' | 'parts' | 'integrations'>('cost');

  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: ['report-cost'],
    queryFn: () => reportApi.getMaintenanceCost().then(r => r.data),
    enabled: tab === 'cost',
  });

  const { data: freqData, isLoading: freqLoading } = useQuery({
    queryKey: ['report-freq'],
    queryFn: () => reportApi.getRepairFrequency().then(r => r.data),
    enabled: tab === 'frequency',
  });

  const { data: partsData, isLoading: partsLoading } = useQuery({
    queryKey: ['report-parts'],
    queryFn: () => reportApi.getPartsConsumption().then(r => r.data),
    enabled: tab === 'parts',
  });

  const erpSyncMutation = useMutation({
    mutationFn: integrationApi.syncFromERP,
    onSuccess: () => toast.success('ERP sync completed (simulated)'),
    onError: () => toast.error('Sync failed'),
  });

  const invSyncMutation = useMutation({
    mutationFn: integrationApi.syncInventory,
    onSuccess: () => toast.success('Inventory sync completed (simulated)'),
    onError: () => toast.error('Sync failed'),
  });

  const exportMutation = useMutation({
    mutationFn: integrationApi.exportToERP,
    onSuccess: (res) => toast.success(res.data.message),
    onError: () => toast.error('Export failed'),
  });

  const downloadCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Reports & Analytics</h1>
          <p className="text-slate-400">Fleet maintenance insights and system integration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 w-fit">
        <TabBtn active={tab === 'cost'} onClick={() => setTab('cost')} icon={BarChart3} label="Maintenance Cost" />
        <TabBtn active={tab === 'frequency'} onClick={() => setTab('frequency')} icon={Wrench} label="Repair Frequency" />
        <TabBtn active={tab === 'parts'} onClick={() => setTab('parts')} icon={Package} label="Parts Consumption" />
        <TabBtn active={tab === 'integrations'} onClick={() => setTab('integrations')} icon={RefreshCw} label="Integrations" />
      </div>

      {/* Maintenance Cost Tab */}
      {tab === 'cost' && (
        costLoading ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total Jobs</p>
                  <p className="text-2xl font-bold text-white font-display">{costData?.summary?.totalJobs || 0}</p>
                </div>
                <div className="card p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-emerald-400 font-display font-mono">
                    KES {(costData?.summary?.totalCost || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <button onClick={() => downloadCSV(costData?.data || [], 'maintenance-cost')} className="btn-secondary">
                <Download size={15} /> Export CSV
              </button>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Cost per Job</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(costData?.data || []).slice(0, 15)} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="jobNumber" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="laborCost" name="Labour" fill="#0ea5e9" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="partsCost" name="Parts" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Job #', 'Vehicle', 'Labour', 'Parts', 'Total', 'Completed'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(costData?.data || []).map((row: any) => (
                    <tr key={row.jobNumber} className="table-row">
                      <td className="px-4 py-3 font-mono text-xs text-sky-400">{row.jobNumber}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{row.vehicle}</td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-300">KES {row.laborCost.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-300">KES {row.partsCost.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-emerald-400">KES {row.totalCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Repair Frequency Tab */}
      {tab === 'frequency' && (
        freqLoading ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => downloadCSV(freqData?.data || [], 'repair-frequency')} className="btn-secondary">
                <Download size={15} /> Export CSV
              </button>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Repairs per Vehicle</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(freqData?.data || []).slice(0, 10)} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="plateNumber" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="totalRepairs" name="Total Repairs" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Plate', 'Make / Model', 'Total Repairs', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(freqData?.data || []).map((row: any) => (
                    <tr key={row.id} className="table-row">
                      <td className="px-4 py-3 font-mono text-sm text-sky-400">{row.plateNumber}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{row.make} {row.model}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 bg-slate-700 rounded-full w-24">
                            <div className="h-1.5 bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (row.totalRepairs / 10) * 100)}%` }} />
                          </div>
                          <span className="text-white font-mono text-sm">{row.totalRepairs}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{row.status.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Parts Consumption Tab */}
      {tab === 'parts' && (
        partsLoading ? <PageLoader /> : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => downloadCSV(partsData?.data || [], 'parts-consumption')} className="btn-secondary">
                <Download size={15} /> Export CSV
              </button>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold text-white mb-4">Top Parts by Usage</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(partsData?.data || []).slice(0, 10)} layout="vertical" barSize={20}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="partName" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="totalUsed" name="Total Used" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Part Name', 'Total Used', 'Total Cost', 'Current Stock', 'Usage Count'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(partsData?.data || []).map((row: any) => (
                    <tr key={row.partId} className="table-row">
                      <td className="px-4 py-3 text-slate-200 font-medium text-sm">{row.partName}</td>
                      <td className="px-4 py-3 font-mono text-slate-300 text-sm">{row.totalUsed}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 text-sm">KES {row.totalCost.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm ${row.currentStock <= 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {row.currentStock} {row.currentStock <= 5 && <AlertTriangle size={12} className="inline" />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{row.usageCount} repairs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Integrations Tab */}
      {tab === 'integrations' && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Simulated integration layer with ERP and external inventory systems.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'ERP Job Card Sync',
                description: 'Pull pending job cards from external ERP system into GMS.',
                icon: RefreshCw,
                action: () => erpSyncMutation.mutate(),
                loading: erpSyncMutation.isPending,
                color: 'sky',
              },
              {
                title: 'Inventory Sync',
                description: 'Synchronize parts inventory with external procurement system.',
                icon: Package,
                action: () => invSyncMutation.mutate(),
                loading: invSyncMutation.isPending,
                color: 'purple',
              },
              {
                title: 'Export to ERP',
                description: 'Push completed job cards and billing data to ERP system.',
                icon: Download,
                action: () => exportMutation.mutate(),
                loading: exportMutation.isPending,
                color: 'emerald',
              },
            ].map(({ title, description, icon: Icon, action, loading, color }) => (
              <div key={title} className="card p-6 flex flex-col gap-4">
                <div className={`w-11 h-11 bg-${color}-500/10 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${color}-400`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white mb-1">{title}</h3>
                  <p className="text-slate-400 text-sm">{description}</p>
                </div>
                <button
                  onClick={action}
                  disabled={loading}
                  className="btn-secondary w-full justify-center"
                >
                  {loading ? <><RefreshCw size={14} className="animate-spin" />Running...</> : <><RefreshCw size={14} />Run Sync</>}
                </button>
              </div>
            ))}
          </div>
          <div className="card p-5 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-emerald-400" />
              <h4 className="font-medium text-white">Integration Status</h4>
            </div>
            <div className="space-y-2">
              {['ERP System v2', 'Inventory System v1', 'Billing Gateway'].map((sys) => (
                <div key={sys} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                  <span className="text-slate-300 text-sm">{sys}</span>
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
