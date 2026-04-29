import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, ClipboardList, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jobCardApi, inventoryApi } from '../services/api';

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }> = ({
  icon: Icon, label, value, sub, color = '#0ea5e9'
}) => (
  <div className="card p-5 flex items-start gap-4">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  </div>
);

const PIE_COLORS = ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444'];

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  IN_SERVICE: 'In Service',
  UNDER_REPAIR: 'Under Repair',
  OUT_OF_SERVICE: 'Out of Service',
};

const Dashboard: React.FC = () => {
  const { data: statsRes } = useQuery({
    queryKey: ['dashboard'],
    queryFn: jobCardApi.getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: invRes } = useQuery({
    queryKey: ['inv-summary'],
    queryFn: inventoryApi.getSummary,
  });

  const stats = statsRes?.data?.data;
  const inv = invRes?.data?.data;

  const vehicleChartData = stats ? [
    { name: 'Available', value: stats.availableVehicles },
    { name: 'In Service', value: stats.inServiceVehicles },
    { name: 'Under Repair', value: stats.underRepairVehicles },
    { name: 'Out of Service', value: stats.outOfServiceVehicles },
  ].filter(d => d.value > 0) : [];

  const jobStatusData = stats?.recentActivity
    ? Object.entries(
        stats.recentActivity.reduce((acc: any, jc: any) => {
          acc[jc.status] = (acc[jc.status] || 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => ({ status, count }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Fleet operations overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Total Vehicles" value={stats?.totalVehicles ?? '—'} sub={`${stats?.availableVehicles ?? 0} available`} color="#0ea5e9" />
        <StatCard icon={ClipboardList} label="Active Jobs" value={stats?.activeJobCards ?? '—'} sub="In progress" color="#f59e0b" />
        <StatCard icon={CheckCircle} label="Completed Today" value={stats?.completedToday ?? '—'} sub="Today" color="#10b981" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={inv?.lowStockCount ?? '—'} sub={`of ${inv?.totalParts ?? 0} parts`} color="#ef4444" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Recent Job Activity</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Status distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={jobStatusData} barSize={32}>
              <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: '#f1f5f9' }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Vehicle Status</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Fleet availability breakdown</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={vehicleChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                  {vehicleChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {vehicleChartData.map(({ name, value }, i) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Recent Job Cards</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Latest repair workflow activity</p>
        <div className="space-y-3">
          {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((jc: any) => (
            <div key={jc.id} className="flex items-center gap-4 p-3 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
                <Wrench className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm" style={{ color: 'var(--accent)' }}>{jc.jobNumber}</span>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {jc.vehicle?.plateNumber} · {jc.status}
                </p>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {jc.technician?.name || 'Unassigned'}
              </span>
            </div>
          )) : (
            <p className="text-center py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;