'use client';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';
import { Clock } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-aws-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Clock size={48} className="text-aws-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-medium text-aws-gray-700">Coming Soon</h1>
            <p className="text-aws-gray-500 text-sm mt-2 max-w-sm">
              This section is a placeholder. In a full AWS Route53 implementation, this feature would be available here.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
