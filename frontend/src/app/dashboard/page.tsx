'use client';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';
import { Globe, Activity, BarChart3, Clock } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-medium text-aws-gray-900">Route 53 Dashboard</h1>
            <p className="text-sm text-aws-gray-500 mt-1">Monitor your DNS infrastructure</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Hosted Zones', value: '—', icon: Globe, color: 'text-aws-blue' },
              { label: 'DNS Queries / day', value: 'Coming Soon', icon: BarChart3, color: 'text-aws-orange' },
              { label: 'Health Checks', value: 'Coming Soon', icon: Activity, color: 'text-aws-green' },
              { label: 'Traffic Policies', value: 'Coming Soon', icon: Clock, color: 'text-aws-gray-500' },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-aws-gray-500 uppercase tracking-wide">{s.label}</p>
                  <s.icon size={16} className={s.color} />
                </div>
                <p className="text-xl font-bold text-aws-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Coming soon notice */}
          <div className="card p-8 text-center">
            <BarChart3 size={40} className="text-aws-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-medium text-aws-gray-700">Dashboard Coming Soon</h2>
            <p className="text-sm text-aws-gray-500 mt-2">
              DNS query metrics, traffic insights, and health check summaries will appear here.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
