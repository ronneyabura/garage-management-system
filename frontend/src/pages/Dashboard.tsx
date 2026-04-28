import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, ClipboardList, CheckCircle, AlertTriangle, Package, TrendingUp, Clock, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportApi } from '../services/api';
import { PageLoader } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }> = ({
  icon: Icon, label, value, sub, color = 'text-sky-400'
}) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-white font-display">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const PIE_COLORS = ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportApi.getDashboard().then(r => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const vehicleChartData = Object.entries(data.vehiclesByStatus || {}).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count as number,
  }));

  const jobStatusData = Object.entries(data.jobCardsByStatus || {}).map(([status, count]) => ({
    status: status.charAt(0) + status.slice(1).toLowerCase(),
    count: count as number,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400">Fleet operations overview — live</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Total Vehicles" value={data.totalVehicles} sub={`${data.vehiclesByStatus?.AVAILABLE || 0} available`} />
        <StatCard icon={ClipboardList} label="Active Jobs" value={data.activeJobCards} sub="In progress" color="text-amber-400" />
        <StatCard icon={CheckCircle} label="Done This Month" value={data.completedThisMonth} sub="Completed" color="text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts" value={data.lowStockParts} sub={`of ${data.totalParts} parts`} color="text-red-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Status Bar Chart */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-1">Job Cards by Status</h3>
          <p className="text-slate-500 text-xs mb-5">Current workflow distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={jobStatusData} barSize={32}>
              <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status Pie */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-white mb-1">Vehicle Status</h3>
          <p className="text-slate-500 text-xs mb-5">Fleet availability breakdown</p>
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
                  <span className="text-slate-400 text-xs flex-1 capitalize">{name.toLowerCase()}</span>
                  <span className="text-white text-xs font-medium">{value as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Job Cards */}
      <div className="card p-6">
        <h3 className="font-display font-bold text-white mb-1">Recent Job Cards</h3>
        <p className="text-slate-500 text-xs mb-5">Latest repair workflow activity</p>
        <div className="space-y-3">
          {data.recentJobCards?.map((jc: any) => (
            <div key={jc.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
              <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wrench className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-sky-400">{jc.jobNumber}</span>
                  <StatusBadge type="job" status={jc.status} />
                </div>
                <div className="text-slate-400 text-xs mt-0.5 truncate">
                  {jc.vehicle?.make} {jc.vehicle?.model} ({jc.vehicle?.plateNumber}) · {jc.description}
                </div>
              </div>
              <div className="text-slate-500 text-xs flex-shrink-0">
                {formatDistanceToNow(new Date(jc.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
