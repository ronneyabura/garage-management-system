import { VehicleStatus, JobCardStatus, Priority } from '../types';

export const vehicleStatusConfig: Record<VehicleStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:    { label: 'Available',     color: 'text-emerald-400', bg: 'bg-emerald-500/15 text-emerald-400' },
  IN_SERVICE:   { label: 'In Service',    color: 'text-blue-400',    bg: 'bg-blue-500/15 text-blue-400' },
  UNDER_REPAIR: { label: 'Under Repair',  color: 'text-amber-400',   bg: 'bg-amber-500/15 text-amber-400' },
  OUT_OF_SERVICE: { label: 'Out of Service', color: 'text-red-400',  bg: 'bg-red-500/15 text-red-400' },
};

export const jobStatusConfig: Record<JobCardStatus, { label: string; bg: string; step: number }> = {
  INTAKE:     { label: 'Intake',     bg: 'bg-slate-500/20 text-slate-400',   step: 0 },
  DIAGNOSIS:  { label: 'Diagnosis',  bg: 'bg-purple-500/20 text-purple-400', step: 1 },
  REPAIR:     { label: 'Repair',     bg: 'bg-amber-500/20 text-amber-400',   step: 2 },
  TESTING:    { label: 'Testing',    bg: 'bg-blue-500/20 text-blue-400',     step: 3 },
  COMPLETED:  { label: 'Completed',  bg: 'bg-emerald-500/20 text-emerald-400', step: 4 },
  CANCELLED:  { label: 'Cancelled',  bg: 'bg-red-500/20 text-red-400',       step: -1 },
};

export const priorityConfig: Record<Priority, { label: string; bg: string; dot: string }> = {
  LOW:      { label: 'Low',      bg: 'bg-slate-500/20 text-slate-400',  dot: 'bg-slate-400' },
  MEDIUM:   { label: 'Medium',   bg: 'bg-blue-500/20 text-blue-400',    dot: 'bg-blue-400' },
  HIGH:     { label: 'High',     bg: 'bg-amber-500/20 text-amber-400',  dot: 'bg-amber-400' },
  CRITICAL: { label: 'Critical', bg: 'bg-red-500/20 text-red-400',      dot: 'bg-red-400' },
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string | undefined): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

export const formatDateTime = (date: string | undefined): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
};

export const timeAgo = (date: string): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const fullName = (user?: { firstName?: string; lastName?: string } | null): string =>
  user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '—';
