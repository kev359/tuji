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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'Member'}!
          </h1>
          <p className="text-gray-600 mt-2">Here's your financial overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Contributions */}
          <div className="card border-0" style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
            color: 'white'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white opacity-90 mb-1">
                  Total Contributions
                </p>
                <p className="text-3xl font-bold text-white drop-shadow-lg">
                  KES {stats.totalContributions.toLocaleString()}
                </p>
              </div>
              <div className="w-14 h-14 bg-white bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Confirmed Contributions */}
          <div className="card border-0" style={{
            background: 'linear-gradient(135deg, #14B8A6 0%, #5EEAD4 100%)',
            color: 'white'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white opacity-90 mb-1">
                  Confirmed Contributions
                </p>
                <p className="text-3xl font-bold text-white drop-shadow-lg">
                  KES {stats.confirmedContributions.toLocaleString()}
                </p>
              </div>
              <div className="w-14 h-14 bg-white bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Loans */}
          <div className="card border-0" style={{
            background: 'linear-gradient(135deg, #9333EA 0%, #C084FC 100%)',
            color: 'white'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white opacity-90 mb-1">
                  Active Loans
                </p>
                <p className="text-3xl font-bold text-white drop-shadow-lg">
                  {stats.activeLoans}
                </p>
              </div>
              <div className="w-14 h-14 bg-white bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Loan Balance */}
          <div className="card border-0" style={{
            background: 'linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)',
            color: 'white'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white opacity-90 mb-1">
                  Outstanding Balance
                </p>
                <p className="text-3xl font-bold text-white drop-shadow-lg">
                  KES {stats.loanBalance.toLocaleString()}
                </p>
              </div>
              <div className="w-14 h-14 bg-white bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/contributions')}
              className="btn-primary text-center"
            >
              Record Contribution
            </button>
            <button
              onClick={() => router.push('/loans')}
              className="btn-secondary text-center"
            >
              Request Loan
            </button>
            <button
              onClick={() => router.push('/members')}
              className="btn-outline text-center"
            >
              View Members
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
