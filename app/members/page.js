'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function MembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/');
      return;
    }

    await fetchMembers();
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching members:', error);
      return;
    }

    // Fetch contribution and loan stats for each member
    const membersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        // Get contributions
        const { data: contributions } = await supabase
          .from('contributions')
          .select('*')
          .eq('member_id', profile.id)
          .eq('status', 'confirmed');

        const totalContributions = contributions?.reduce(
          (sum, c) => sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0),
          0
        ) || 0;

        // Get loans
        const { data: loans } = await supabase
          .from('loans')
          .select('*')
          .eq('member_id', profile.id);

        const activeLoans = loans?.filter(l => l.status === 'active' || l.status === 'approved').length || 0;

        return {
          ...profile,
          totalContributions,
          activeLoans,
        };
      })
    );

    setMembers(membersWithStats);
  };

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
          <p className="mt-4 text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Group Members</h1>
          <p className="text-gray-600 mt-2">View all TUJIIMARISHE members</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm font-medium text-green-700 mb-1">Total Members</p>
            <p className="text-3xl font-bold text-green-900">{members.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm font-medium text-blue-700 mb-1">Regular Members</p>
            <p className="text-3xl font-bold text-blue-900">
              {members.filter(m => m.role === 'member').length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <p className="text-sm font-medium text-yellow-700 mb-1">Treasurers</p>
            <p className="text-3xl font-bold text-yellow-900">
              {members.filter(m => m.role === 'treasurer').length}
            </p>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div key={member.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {member.full_name?.charAt(0) || member.email?.charAt(0) || '?'}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">
                      {member.full_name || 'Not Set'}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                  </div>
                </div>
                {member.role === 'treasurer' && (
                  <span className="badge badge-pending text-xs">
                    Admin
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone_number && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{member.phone_number}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Contributions</p>
                  <p className="text-sm font-bold text-green-700">
                    KES {member.totalContributions?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Loans</p>
                  <p className="text-sm font-bold text-blue-700">
                    {member.activeLoans || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 card">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
          </div>
        )}
      </main>
    </div>
  );
}
