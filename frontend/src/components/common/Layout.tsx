import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => (
  <div className="flex h-screen bg-slate-950">
    <Sidebar />
    <main className="flex-1 ml-64 overflow-y-auto">
      <div className="p-8 min-h-full">
        <Outlet />
      </div>
    </main>
  </div>
);
