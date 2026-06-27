'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Eye, EyeOff, Globe } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo@route53clone.com');
  const [password, setPassword] = useState('Demo@12345');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(name, email, password);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aws-navy flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex gap-[3px]">
          <div className="w-4 h-4 bg-aws-orange rounded-sm" />
          <div className="w-4 h-4 bg-aws-orange rounded-sm opacity-70" />
          <div className="w-4 h-4 bg-aws-orange rounded-sm opacity-40" />
        </div>
        <span className="text-white text-2xl font-bold tracking-tight">aws</span>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Service badge */}
          <div className="bg-aws-navy-light px-6 py-4 flex items-center gap-2">
            <Globe size={18} className="text-aws-orange" />
            <div>
              <p className="text-xs text-aws-gray-400">Amazon Web Services</p>
              <p className="text-white font-medium text-sm">Route 53 — DNS Management Console</p>
            </div>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex border-b border-aws-gray-200 mb-6">
              {(['login', 'register'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-aws-orange text-aws-orange' : 'border-transparent text-aws-gray-500 hover:text-aws-gray-700'}`}
                >
                  {t === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {tab === 'register' && (
                <div>
                  <label className="label">Full name</label>
                  <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                </div>
              )}
              <div>
                <label className="label">Email address (IAM user)</label>
                <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-aws-gray-400"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-aws-red-light border border-aws-red text-aws-red text-sm px-3 py-2 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full justify-center flex items-center"
              >
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </div>

            {tab === 'login' && (
              <div className="mt-4 p-3 bg-aws-blue-light border border-aws-blue border-opacity-30 rounded text-xs text-aws-blue-dark">
                <strong>Demo credentials:</strong><br />
                Email: demo@route53clone.com<br />
                Password: Demo@12345
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-aws-gray-500 text-xs mt-6">
          © 2024, Amazon Web Services Clone. All rights reserved.
        </p>
      </div>
    </div>
  );
}
