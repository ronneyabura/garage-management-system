import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
      <Icon className="w-8 h-8 text-slate-500" />
    </div>
    <h3 className="text-lg font-medium text-slate-300 mb-1">{title}</h3>
    {description && <p className="text-slate-500 text-sm mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
);
