'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe, BarChart3, Shield, Activity, Settings, ChevronRight, Network
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3, badge: null },
  { label: 'Hosted zones', href: '/hosted-zones', icon: Globe, badge: null },
  { label: 'Traffic policies', href: '/traffic-policies', icon: Network, badge: 'Coming Soon' },
  { label: 'Health checks', href: '/health-checks', icon: Activity, badge: 'Coming Soon' },
  { label: 'Resolver', href: '/resolver', icon: Settings, badge: 'Coming Soon' },
  { label: 'Profiles', href: '/profiles', icon: Shield, badge: 'Coming Soon' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[220px] min-h-screen bg-aws-navy flex flex-col">
      {/* Service header */}
      <div className="px-4 py-4 border-b border-aws-navy-light">
        <div className="flex items-center gap-2 text-white">
          <Globe size={18} className="text-aws-orange" />
          <div>
            <p className="text-xs text-aws-gray-400">Route 53</p>
            <p className="text-sm font-medium">DNS Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center justify-between px-3 py-2 rounded text-sm mb-0.5 transition-colors duration-150',
                isActive
                  ? 'text-white bg-aws-navy-light'
                  : 'text-aws-gray-300 hover:text-white hover:bg-aws-navy-light'
              )}
            >
              <span className="flex items-center gap-2">
                <Icon size={15} />
                {item.label}
              </span>
              {item.badge ? (
                <span className="text-[10px] bg-aws-gray-700 text-aws-gray-400 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight size={12} />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-aws-navy-light">
        <p className="text-aws-gray-500 text-xs">Route 53 Clone v1.0</p>
        <p className="text-aws-gray-600 text-xs">© 2024 AWS Clone</p>
      </div>
    </div>
  );
}
