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
    <nav 
      style={{
        background: 'rgba(20, 20, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 159, 10, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 159, 10, 0.1)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-all group">
              <img 
                src="/tujlogo.webp" 
                alt="Tujiimarishe SHG Logo" 
                className="h-14 w-auto object-contain group-hover:scale-105 transition-transform"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255, 159, 10, 0.3))',
                }}
              />
              <span 
                className="text-2xl font-bold hidden md:block"
                style={{
                  background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 50%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 30px rgba(255, 159, 10, 0.3)',
                }}
              >
                Tujiimarishe SHG
              </span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-2">
            <Link
              href="/dashboard"
              style={isActive('/dashboard') ? {
                background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 100%)',
                boxShadow: '0 0 20px rgba(255, 159, 10, 0.4)',
                border: '1px solid rgba(255, 159, 10, 0.3)',
              } : {
                background: 'rgba(255, 159, 10, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
            >
              <span style={{ color: isActive('/dashboard') ? '#fff' : '#FFB84D' }}>
                Dashboard
              </span>
            </Link>
            <Link
              href="/contributions"
              style={isActive('/contributions') ? {
                background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
                boxShadow: '0 0 20px rgba(0, 217, 192, 0.4)',
                border: '1px solid rgba(0, 217, 192, 0.3)',
              } : {
                background: 'rgba(0, 217, 192, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
            >
              <span style={{ color: isActive('/contributions') ? '#fff' : '#4DFFEA' }}>
                Contributions
              </span>
            </Link>
            <Link
              href="/loans"
              style={isActive('/loans') ? {
                background: 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              } : {
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
            >
              <span style={{ color: isActive('/loans') ? '#fff' : '#C084FC' }}>
                Loans
              </span>
            </Link>
            <Link
              href="/members"
              style={isActive('/members') ? {
                background: 'linear-gradient(135deg, #0A84FF 0%, #00D9C0 100%)',
                boxShadow: '0 0 20px rgba(10, 132, 255, 0.4)',
                border: '1px solid rgba(10, 132, 255, 0.3)',
              } : {
                background: 'rgba(10, 132, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
            >
              <span style={{ color: isActive('/members') ? '#fff' : '#64B5F6' }}>
                Members
              </span>
            </Link>
            {profile?.role === 'treasurer' && (
              <Link
                href="/admin"
                style={isActive('/admin') ? {
                  background: 'linear-gradient(135deg, #FF9F0A 0%, #FF453A 100%)',
                  boxShadow: '0 0 30px rgba(255, 159, 10, 0.6)',
                  border: '2px solid rgba(255, 159, 10, 0.5)',
                } : {
                  background: 'rgba(255, 159, 10, 0.1)',
                  border: '2px solid #FF9F0A',
                }}
                className="px-4 py-2 rounded-lg font-bold transition-all hover:scale-105 animate-pulse"
              >
                <span style={{ color: '#fff', textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                  ⚡ Admin Panel
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold" style={{ color: '#F8F9FA' }}>
                  {profile.full_name}
                </p>
                <p className="text-xs capitalize" style={{ 
                  color: '#FFB84D',
                  textShadow: '0 0 10px rgba(255, 184, 77, 0.3)',
                }}>
                  {profile.role}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 69, 58, 0.1)',
                border: '2px solid #FF453A',
                color: '#FF8A80',
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'all 300ms',
                backdropFilter: 'blur(10px)',
              }}
              className="hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className="md:hidden px-4 py-3 space-y-2"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(10, 10, 15, 0.6)',
        }}
      >
        <Link
          href="/dashboard"
          style={isActive('/dashboard') ? {
            background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 100%)',
            color: '#fff',
          } : {
            background: 'rgba(255, 159, 10, 0.05)',
            color: '#FFB84D',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          className="block px-4 py-2 rounded-lg font-semibold transition-all"
        >
          Dashboard
        </Link>
        <Link
          href="/contributions"
          style={isActive('/contributions') ? {
            background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
            color: '#fff',
          } : {
            background: 'rgba(0, 217, 192, 0.05)',
            color: '#4DFFEA',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          className="block px-4 py-2 rounded-lg font-semibold transition-all"
        >
          Contributions
        </Link>
        <Link
          href="/loans"
          style={isActive('/loans') ? {
            background: 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)',
            color: '#fff',
          } : {
            background: 'rgba(168, 85, 247, 0.05)',
            color: '#C084FC',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          className="block px-4 py-2 rounded-lg font-semibold transition-all"
        >
          Loans
        </Link>
        <Link
          href="/members"
          style={isActive('/members') ? {
            background: 'linear-gradient(135deg, #0A84FF 0%, #00D9C0 100%)',
            color: '#fff',
          } : {
            background: 'rgba(10, 132, 255, 0.05)',
            color: '#64B5F6',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          className="block px-4 py-2 rounded-lg font-semibold transition-all"
        >
          Members
        </Link>
        {profile?.role === 'treasurer' && (
          <Link
            href="/admin"
            style={isActive('/admin') ? {
              background: 'linear-gradient(135deg, #FF9F0A 0%, #FF453A 100%)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(255, 159, 10, 0.4)',
            } : {
              background: 'rgba(255, 159, 10, 0.1)',
              color: '#FF9F0A',
              border: '1px solid #FF9F0A',
            }}
            className="block px-4 py-2 rounded-lg font-bold transition-all"
          >
            ⚡ Admin Panel
          </Link>
        )}
      </div>
    </nav>
  );
}
