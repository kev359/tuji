'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContributions: 0,
    confirmedContributions: 0,
    activeLoans: 0,
    loanBalance: 0,
  });
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/');
      return;
    }

    setUser(user);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);
    localStorage.setItem('profile', JSON.stringify(profileData));

    // Fetch stats
    await fetchStats(user.id);
    setLoading(false);
  };

  const fetchStats = async (userId) => {
    // Fetch contributions
    const { data: contributions } = await supabase
      .from('contributions')
      .select('*')
      .eq('member_id', userId);

    const totalContributions = contributions?.reduce(
      (sum, c) => sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0),
      0
    ) || 0;

    const confirmedContributions = contributions?.filter(c => c.status === 'confirmed').reduce(
      (sum, c) => sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0),
      0
    ) || 0;

    // Fetch loans
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('member_id', userId);

    const activeLoans = loans?.filter(l => l.status === 'active' || l.status === 'approved').length || 0;
    const loanBalance = loans?.filter(l => l.status === 'active' || l.status === 'approved').reduce(
      (sum, l) => sum + parseFloat(l.balance || 0),
      0
    ) || 0;

    setStats({
      totalContributions,
      confirmedContributions,
      activeLoans,
      loanBalance,
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1A1A1D',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(255, 159, 10, 0.2)',
            borderTop: '3px solid #FF9F0A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}></div>
          <p style={{ color: '#FFB84D', marginTop: '16px', fontWeight: '500' }}>Loading dashboard...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 2 }}>
      <Navbar />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 50%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(255, 159, 10, 0.3)',
          }}>
            Welcome back, {profile?.full_name || 'Member'}!
          </h1>
          <p style={{ color: '#ADB5BD', marginTop: '8px', fontSize: '1rem' }}>
            Here's your financial overview
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* Total Contributions */}
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 159, 10, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 159, 10, 0.1)',
            transition: 'all 300ms',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 159, 10, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 159, 10, 0.1)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FF9F0A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Contributions
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#F8F9FA',
                  textShadow: '0 0 20px rgba(255, 159, 10, 0.3)',
                }}>
                  KES {stats.totalContributions.toLocaleString()}
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.2) 0%, rgba(255, 10, 120, 0.2) 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 159, 10, 0.3)',
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#FF9F0A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Confirmed Contributions */}
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(0, 217, 192, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 217, 192, 0.1)',
            transition: 'all 300ms',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 217, 192, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 217, 192, 0.1)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#00D9C0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Confirmed Contributions
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#F8F9FA',
                  textShadow: '0 0 20px rgba(0, 217, 192, 0.3)',
                }}>
                  KES {stats.confirmedContributions.toLocaleString()}
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(0, 217, 192, 0.2) 0%, rgba(10, 132, 255, 0.2) 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 217, 192, 0.3)',
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#00D9C0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Loans */}
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 85, 247, 0.1)',
            transition: 'all 300ms',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(168, 85, 247, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 85, 247, 0.1)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#A855F7', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Active Loans
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#F8F9FA',
                  textShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                }}>
                  {stats.activeLoans}
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(255, 10, 120, 0.2) 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#A855F7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Loan Balance */}
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 10, 120, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 10, 120, 0.1)',
            transition: 'all 300ms',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 10, 120, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 10, 120, 0.1)';
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FF0A78', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Outstanding Balance
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#F8F9FA',
                  textShadow: '0 0 20px rgba(255, 10, 120, 0.3)',
                }}>
                  KES {stats.loanBalance.toLocaleString()}
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(255, 10, 120, 0.2) 0%, rgba(255, 159, 10, 0.2) 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 10, 120, 0.3)',
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#FF0A78' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'rgba(30, 30, 35, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#F8F9FA',
            marginBottom: '20px',
          }}>Quick Actions</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            <button
              onClick={() => router.push('/contributions')}
              style={{
                background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 300ms',
                boxShadow: '0 8px 24px rgba(255, 159, 10, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 159, 10, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 159, 10, 0.3)';
              }}
            >
              💰 Record Contribution
            </button>
            <button
              onClick={() => router.push('/loans')}
              style={{
                background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 300ms',
                boxShadow: '0 8px 24px rgba(0, 217, 192, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 217, 192, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 217, 192, 0.3)';
              }}
            >
              🏦 Request Loan
            </button>
            <button
              onClick={() => router.push('/members')}
              style={{
                background: 'transparent',
                color: '#A855F7',
                padding: '16px 24px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '1rem',
                border: '2px solid #A855F7',
                cursor: 'pointer',
                transition: 'all 300ms',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(168, 85, 247, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#A855F7';
                e.currentTarget.style.borderColor = '#A855F7';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.2)';
              }}
            >
              👥 View Members
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
