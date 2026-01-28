'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', color: '#FF9F0A' },
    { href: '/contributions', label: 'Contributions', color: '#00D9C0' },
    { href: '/loans', label: 'Loans', color: '#A855F7' },
    { href: '/members', label: 'Members', color: '#0A84FF' },
  ];

  return (
    <nav style={{
      background: 'rgba(20, 20, 25, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 159, 10, 0.2)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img 
              src="/tujlogo.webp" 
              alt="Tujiimarishe SHG" 
              style={{
                height: '45px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(255, 159, 10, 0.3))',
              }}
            />
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 50%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: window?.innerWidth > 768 ? 'block' : 'none',
            }}>
              Tujiimarishe
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'all 200ms',
                  background: isActive(link.href) 
                    ? `linear-gradient(135deg, ${link.color} 0%, ${link.color}CC 100%)`
                    : 'transparent',
                  color: isActive(link.href) ? '#fff' : link.color,
                  border: isActive(link.href) 
                    ? 'none' 
                    : `1px solid ${link.color}33`,
                  boxShadow: isActive(link.href) 
                    ? `0 4px 16px ${link.color}40` 
                    : 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Admin Link */}
            {profile?.role === 'treasurer' && (
              <Link
                href="/admin"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  background: isActive('/admin') 
                    ? 'linear-gradient(135deg, #FF9F0A 0%, #FF453A 100%)'
                    : 'rgba(255, 159, 10, 0.1)',
                  color: '#fff',
                  border: '1px solid #FF9F0A',
                  boxShadow: isActive('/admin') 
                    ? '0 4px 16px rgba(255, 159, 10, 0.4)' 
                    : '0 0 12px rgba(255, 159, 10, 0.2)',
                }}
              >
                ⚡ Admin
              </Link>
            )}
          </div>

          {/* User Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {profile && (
              <div style={{ textAlign: 'right', display: window?.innerWidth > 640 ? 'block' : 'none' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#F8F9FA' }}>
                  {profile.full_name}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#FF9F0A', textTransform: 'capitalize' }}>
                  {profile.role}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                background: 'rgba(255, 69, 58, 0.1)',
                color: '#FF453A',
                border: '1px solid rgba(255, 69, 58, 0.3)',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
