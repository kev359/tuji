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
  const [groupStats, setGroupStats] = useState({
    total_interest: 0,
    total_savings: 0,
    total_table_banking: 0
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
    await Promise.all([
      fetchStats(user.id),
      fetchGroupStats()
    ]);
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

  const fetchGroupStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_group_stats');
      if (error) {
        console.warn('Error fetching group stats (function might not exist yet):', error);
      } else if (data) {
        setGroupStats(data);
      }
    } catch (e) {
      console.error('Unexpected error fetching group stats:', e);
    }
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

        {/* Group Stats Section (Visible to everyone) */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>📊</span> Group Performance
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
             {/* Total Interest Earned */}
             <div style={{
              background: 'linear-gradient(135deg, rgba(50, 215, 75, 0.1) 0%, rgba(50, 215, 75, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(50, 215, 75, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(50, 215, 75, 0.1)',
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(50, 215, 75, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg style={{ width: '24px', height: '24px', color: '#32D74B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span style={{ 
                  background: '#32D74B', 
                  color: '#000', 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  padding: '4px 8px', 
                  borderRadius: '6px' 
                }}>
                  EARNED
                </span>
              </div>
              <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Total Interest Earned</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
                KES {parseFloat(groupStats.total_interest || 0).toLocaleString()}
              </h3>
            </div>

            {/* Table Banking Pool */}
            <div style={{
               background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.1) 0%, rgba(10, 132, 255, 0.05) 100%)',
               backdropFilter: 'blur(20px)',
               borderRadius: '20px',
               padding: '24px',
               border: '1px solid rgba(10, 132, 255, 0.3)',
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(10, 132, 255, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(10, 132, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg style={{ width: '24px', height: '24px', color: '#0A84FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Table Banking Pool</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
                KES {parseFloat(groupStats.total_table_banking || 0).toLocaleString()}
              </h3>
            </div>

            {/* Bank Savings */}
            <div style={{
               background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
               backdropFilter: 'blur(20px)',
               borderRadius: '20px',
               padding: '24px',
               border: '1px solid rgba(168, 85, 247, 0.3)',
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 85, 247, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg style={{ width: '24px', height: '24px', color: '#A855F7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Bank Savings (MMF/I&M)</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
                KES {parseFloat(groupStats.total_bank_savings || 0).toLocaleString()}
              </h3>
            </div>

            {/* Total Loans Given */}
            <div style={{
               background: 'linear-gradient(135deg, rgba(255, 69, 58, 0.1) 0%, rgba(255, 69, 58, 0.05) 100%)',
               backdropFilter: 'blur(20px)',
               borderRadius: '20px',
               padding: '24px',
               border: '1px solid rgba(255, 69, 58, 0.3)',
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 69, 58, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(255, 69, 58, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>💸</span>
                </div>
              </div>
              <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Total Loans Disbursed</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
                KES {parseFloat(groupStats.total_loans_given || 0).toLocaleString()}
              </h3>
            </div>

            {/* Expected Interest */}
            <div style={{
               background: 'linear-gradient(135deg, rgba(50, 215, 75, 0.1) 0%, rgba(10, 132, 255, 0.1) 100%)',
               backdropFilter: 'blur(20px)',
               borderRadius: '20px',
               padding: '24px',
               border: '1px solid rgba(10, 132, 255, 0.3)',
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(10, 132, 255, 0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(10, 132, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📈</span>
                </div>
                 <span style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  color: '#F8F9FA', 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  padding: '4px 8px', 
                  borderRadius: '6px' 
                }}>
                  PROJECTED
                </span>
              </div>
              <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Total Interest Expected</p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
                KES {parseFloat(groupStats.total_interest_expected || 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {/* Individual Stats Grid */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>My Performance</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* My Total Contributions */}
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 159, 10, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#FF9F0A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>My Total Contributions</p>
            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
              KES {stats.confirmedContributions.toLocaleString()}
            </h3>
            <p style={{ color: '#ADB5BD', fontSize: '0.875rem', marginTop: '4px' }}>
              Pending: KES {(stats.totalContributions - stats.confirmedContributions).toLocaleString()}
            </p>
          </div>

          {/* Active Loans */}
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(10, 132, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#0A84FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Active Loans</p>
            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
              {stats.activeLoans}
            </h3>
          </div>

          {/* Loan Balance */}
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 69, 58, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#FF453A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Loan Balance</p>
            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#FF453A' }}>
              KES {stats.loanBalance.toLocaleString()}
            </h3>
          </div>
        </div>
      </main>
    </div>
  );
}
