import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, Package, Wrench, Download, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { reportApi } from '../services/api';
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
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
    style={{
      background: active ? 'rgba(14,165,233,0.1)' : 'transparent',
      color: active ? '#0ea5e9' : 'var(--text-secondary)',
      border: active ? '1px solid rgba(14,165,233,0.2)' : '1px solid transparent',
    }}
  >
    <Icon size={15} />
    {label}
  </button>
);

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

const Reports: React.FC = () => {
  const [tab, setTab] = useState<'cost' | 'frequency' | 'downtime' | 'parts'>('cost');

  const { data: costRes, isLoading: costLoading } = useQuery({
    queryKey: ['report-cost'],
    queryFn: () => reportApi.getMaintenanceCost(),
    enabled: tab === 'cost',
  });

  const { data: freqRes, isLoading: freqLoading } = useQuery({
    queryKey: ['report-freq'],
    queryFn: () => reportApi.getRepairFrequency({ months: 6 }),
    enabled: tab === 'frequency',
  });

  const { data: downRes, isLoading: downLoading } = useQuery({
    queryKey: ['report-down'],
    queryFn: () => reportApi.getDowntime(),
    enabled: tab === 'downtime',
  });

  const { data: partsRes, isLoading: partsLoading } = useQuery({
    queryKey: ['report-parts'],
    queryFn: () => reportApi.getPartsConsumption(),
    enabled: tab === 'parts',
  });

  const costData = costRes?.data?.data;
  const freqData = freqRes?.data?.data;
  const downData = downRes?.data?.data;
  const partsData = partsRes?.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Fleet maintenance insights and operational metrics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabBtn active={tab === 'cost'} onClick={() => setTab('cost')} icon={BarChart3} label="Maintenance Cost" />
        <TabBtn active={tab === 'frequency'} onClick={() => setTab('frequency')} icon={Wrench} label="Repair Frequency" />
        <TabBtn active={tab === 'downtime'} onClick={() => setTab('downtime')} icon={Clock} label="Fleet Downtime" />
        <TabBtn active={tab === 'parts'} onClick={() => setTab('parts')} icon={Package} label="Parts Consumption" />
      </div>

      {/* Maintenance Cost */}
      {tab === 'cost' && (
        costLoading ? <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>Loading...</div> : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-4">
                <div className="card py-3 px-5">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Total Jobs</p>
                  <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{costData?.totalJobs || 0}</p>
                </div>
                <div className="card py-3 px-5">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Total Cost</p>
                  <p className="text-2xl font-bold font-display font-mono" style={{ color: '#10b981' }}>
                    KES {(costData?.totalCost || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadCSV(costData?.summary?.map((s: any) => ({ vehicle: s.vehicle?.plateNumber, make: s.vehicle?.make, totalCost: s.totalCost, repairs: s.repairCount })) || [], 'maintenance-cost')}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Cost per Vehicle</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(costData?.summary || []).map((s: any) => ({ name: s.vehicle?.plateNumber, cost: s.totalCost, repairs: s.repairCount }))} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="cost" name="Total Cost (KES)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Vehicle', 'Make/Model', 'Repairs', 'Total Cost'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(costData?.summary || []).map((row: any) => (
                    <tr key={row.vehicle?.plateNumber} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--accent)' }}>{row.vehicle?.plateNumber}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{row.vehicle?.make} {row.vehicle?.model}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.repairCount}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: '#10b981' }}>KES {row.totalCost?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Repair Frequency */}
      {tab === 'frequency' && (
        freqLoading ? <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>Loading...</div> : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="card py-3 px-5">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Total Jobs (6mo)</p>
                  <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{freqData?.totalJobs || 0}</p>
                </div>
                <div className="card py-3 px-5">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Completion Rate</p>
                  <p className="text-2xl font-bold font-display" style={{ color: '#10b981' }}>{freqData?.completionRate || 0}%</p>
                </div>
              </div>
              <button onClick={() => downloadCSV(freqData?.monthlyTrend || [], 'repair-frequency')}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Repair Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={freqData?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      )}

      {/* Downtime */}
      {tab === 'downtime' && (
        downLoading ? <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>Loading...</div> : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="card py-3 px-5">
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Total Downtime</p>
                <p className="text-2xl font-bold font-display" style={{ color: '#f59e0b' }}>{downData?.totalDowntimeHours || 0}h</p>
              </div>
              <button onClick={() => downloadCSV(downData?.byVehicle?.map((v: any) => ({ plate: v.vehicle?.plateNumber, hours: v.totalDowntimeHours, repairs: v.repairCount })) || [], 'downtime')}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Downtime by Vehicle (Hours)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(downData?.byVehicle || []).map((v: any) => ({ name: v.vehicle?.plateNumber, hours: v.totalDowntimeHours, avg: v.avgDowntimeHours }))} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="hours" name="Total Hours" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avg" name="Avg Hours/Job" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Vehicle', 'Make/Model', 'Repairs', 'Total Downtime', 'Avg per Repair'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(downData?.byVehicle || []).map((v: any) => (
                    <tr key={v.vehicle?.plateNumber} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--accent)' }}>{v.vehicle?.plateNumber}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{v.vehicle?.make} {v.vehicle?.model}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{v.repairCount}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: '#f59e0b' }}>{v.totalDowntimeHours}h</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{v.avgDowntimeHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Parts Consumption */}
      {tab === 'parts' && (
        partsLoading ? <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>Loading...</div> : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => downloadCSV((partsData || []).map((p: any) => ({ part: p.part?.name, category: p.part?.category, qty: p.totalQuantity, cost: p.totalCost })), 'parts-consumption')}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Parts by Cost</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(partsData || []).slice(0, 8).map((p: any) => ({ name: p.part?.name?.slice(0, 15), cost: p.totalCost, qty: p.totalQuantity }))} layout="vertical" barSize={20}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="cost" name="Total Cost (KES)" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Part Name', 'Category', 'Qty Used', 'Total Cost', 'Times Used'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(partsData || []).map((p: any, i: number) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.part?.name}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.part?.category || '—'}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{p.totalQuantity}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: '#8b5cf6' }}>KES {p.totalCost?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.usageCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Reports;