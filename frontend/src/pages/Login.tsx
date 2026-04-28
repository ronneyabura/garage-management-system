import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@gms.com');
  const [password, setPassword] = useState('password123');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800 flex-col p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(14,165,233,0.08)_0%,_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-white text-xl font-bold">GMS</span>
          </div>

          <h1 className="font-display text-5xl font-bold text-white mb-6 leading-tight">
            Fleet Operations<br />
            <span className="text-sky-400">Unified.</span>
          </h1>

          <p className="text-slate-400 text-lg mb-12 max-w-md leading-relaxed">
            Centralize vehicle servicing, repair workflows, and maintenance tracking across your entire workshop.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Vehicle Tracking', value: 'Real-time' },
              { label: 'Job Workflow', value: '5 Stages' },
              { label: 'Cost Analytics', value: 'Detailed' },
              { label: 'Inventory Alerts', value: 'Automated' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className="text-sky-400 font-medium text-sm mb-1">{value}</div>
                <div className="text-slate-400 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-white font-bold">GMS</span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">Sign in</h2>
          <p className="text-slate-400 mb-8">Enter your credentials to access the system</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">Demo Accounts</p>
            <div className="space-y-1">
              {[
                { label: 'Admin', email: 'admin@gms.com' },
                { label: 'Manager', email: 'manager@gms.com' },
                { label: 'Technician', email: 'tech1@gms.com' },
              ].map(({ label, email: e }) => (
                <button
                  key={e}
                  onClick={() => { setEmail(e); setPassword('password123'); }}
                  className="w-full text-left text-xs text-slate-400 hover:text-sky-400 transition-colors py-0.5"
                >
                  <span className="font-medium">{label}:</span> {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
