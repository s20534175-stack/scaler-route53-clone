'use client';
import { useState } from 'react';
import { ChevronDown, Bell, HelpCircle, Globe, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function TopNav() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="bg-aws-navy h-[50px] flex items-center px-4 gap-4 z-50 relative">
      {/* AWS Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="flex gap-[2px]">
          <div className="w-3 h-3 bg-aws-orange rounded-sm" />
          <div className="w-3 h-3 bg-aws-orange rounded-sm opacity-70" />
          <div className="w-3 h-3 bg-aws-orange rounded-sm opacity-40" />
        </div>
        <span className="text-white font-bold text-base tracking-tight">aws</span>
      </div>

      {/* Services */}
      <button className="flex items-center gap-1 text-white text-sm hover:text-aws-orange transition-colors px-2 py-1 rounded">
        Services <ChevronDown size={14} />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-lg relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-aws-gray-400" size={14} />
        <input
          type="text"
          placeholder="Search for services, features, marketplace products, and docs"
          className="w-full bg-aws-navy-light text-white placeholder-aws-gray-400 text-xs px-9 py-1.5 rounded border border-aws-gray-600 focus:outline-none focus:border-aws-orange"
        />
      </div>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-aws-gray-300 hover:text-white">
          <Bell size={16} />
        </button>
        <button className="p-2 text-aws-gray-300 hover:text-white">
          <HelpCircle size={16} />
        </button>
        <button className="flex items-center gap-1 text-aws-gray-300 hover:text-white text-xs px-2">
          <Globe size={14} /> N. Virginia <ChevronDown size={12} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 text-aws-gray-300 hover:text-white text-xs px-2 py-1"
          >
            <span className="text-aws-orange font-medium">{user?.name || 'User'}</span>
            <ChevronDown size={12} />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-8 w-56 bg-white border border-aws-gray-200 rounded shadow-lg z-50">
              <div className="px-4 py-3 border-b border-aws-gray-200">
                <p className="text-sm font-medium text-aws-gray-900">{user?.name}</p>
                <p className="text-xs text-aws-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-aws-gray-700 hover:bg-aws-gray-100">
                  Account
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-aws-gray-700 hover:bg-aws-gray-100">
                  Security credentials
                </button>
                <hr className="my-1 border-aws-gray-200" />
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-aws-red hover:bg-aws-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
