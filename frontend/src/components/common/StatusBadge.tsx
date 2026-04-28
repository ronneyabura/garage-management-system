import React from 'react';
import { VehicleStatus, JobCardStatus } from '../../types';

const vehicleColors: Record<VehicleStatus, string> = {
  AVAILABLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  IN_SERVICE: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  UNDER_REPAIR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  OUT_OF_SERVICE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const jobColors: Record<JobCardStatus, string> = {
  INTAKE: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  DIAGNOSIS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REPAIR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  TESTING: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-500/10 text-slate-400',
  NORMAL: 'bg-sky-500/10 text-sky-400',
  HIGH: 'bg-amber-500/10 text-amber-400',
  URGENT: 'bg-red-500/10 text-red-400',
};

interface Props {
  type: 'vehicle' | 'job' | 'priority';
  status: string;
}

export const StatusBadge: React.FC<Props> = ({ type, status }) => {
  const color = type === 'vehicle'
    ? vehicleColors[status as VehicleStatus] || 'bg-slate-500/10 text-slate-400'
    : type === 'job'
    ? jobColors[status as JobCardStatus] || 'bg-slate-500/10 text-slate-400'
    : priorityColors[status] || 'bg-slate-500/10 text-slate-400';

  const label = status.replace(/_/g, ' ');

  return (
    <span className={`badge border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};
