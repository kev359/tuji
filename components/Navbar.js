'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    router.push('/');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b-4" style={{ borderImage: 'linear-gradient(90deg, #F59E0B, #EC4899, #9333EA) 1' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src="/tujlogo.webp" 
                alt="Tujiimarishe SHG Logo" 
                className="h-12 w-auto object-contain"
              />
              <span className="text-2xl font-bold hidden md:block"
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #9333EA 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                Tujiimarishe SHG
              </span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/dashboard')
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50'
              }`}
              style={isActive('/dashboard') ? {
                background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)'
              } : {}}
            >
              Dashboard
            </Link>
            <Link
              href="/contributions"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/contributions')
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50'
              }`}
              style={isActive('/contributions') ? {
                background: 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)'
              } : {}}
            >
              Contributions
            </Link>
            <Link
              href="/loans"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/loans')
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50'
              }`}
              style={isActive('/loans') ? {
                background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)'
              } : {}}
            >
              Loans
            </Link>
            <Link
              href="/members"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/members')
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50'
              }`}
              style={isActive('/members') ? {
                background: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)'
              } : {}}
            >
              Members
            </Link>
            {profile?.role === 'treasurer' && (
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-lg font-bold transition-all shadow-md ${
                  isActive('/admin')
                    ? 'text-white'
                    : 'text-orange-600 border-2 border-orange-500 hover:text-white'
                }`}
                style={isActive('/admin') ? {
                  background: 'linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)'
                } : {}}
              >
                ⚡ Admin Panel
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 
                       border border-red-600 hover:border-red-700 rounded-lg 
                       transition-all hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-1">
        <Link
          href="/dashboard"
          className={`block px-4 py-2 rounded-lg font-medium transition-all ${
            isActive('/dashboard')
              ? 'bg-[#2E7D32] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/contributions"
          className={`block px-4 py-2 rounded-lg font-medium transition-all ${
            isActive('/contributions')
              ? 'bg-[#2E7D32] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Contributions
        </Link>
        <Link
          href="/loans"
          className={`block px-4 py-2 rounded-lg font-medium transition-all ${
            isActive('/loans')
              ? 'bg-[#2E7D32] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Loans
        </Link>
        <Link
          href="/members"
          className={`block px-4 py-2 rounded-lg font-medium transition-all ${
            isActive('/members')
              ? 'bg-[#2E7D32] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Members
        </Link>
        {profile?.role === 'treasurer' && (
          <Link
            href="/admin"
            className={`block px-4 py-2 rounded-lg font-medium transition-all ${
              isActive('/admin')
                ? 'bg-[#FFD700] text-gray-900'
                : 'text-[#FFD700] border border-[#FFD700] hover:bg-[#FFD700] hover:text-gray-900'
            }`}
          >
            Admin Panel
          </Link>
        )}
      </div>
    </nav>
  );
}
