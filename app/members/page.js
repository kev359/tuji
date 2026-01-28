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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(10, 132, 255, 0.2)',
            borderTop: '3px solid #0A84FF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}></div>
          <p style={{ color: '#64B5F6', marginTop: '16px', fontWeight: '500' }}>Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 2 }}>
      <Navbar />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #0A84FF 0%, #00D9C0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Group Members
          </h1>
          <p style={{ color: '#ADB5BD', marginTop: '8px' }}>View all TUJIIMARISHE members</p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '32px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px 16px 50px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(30, 30, 35, 0.7)',
              backdropFilter: 'blur(20px)',
              color: '#F8F9FA',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              transition: 'all 300ms',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0A84FF';
              e.target.style.boxShadow = '0 0 0 4px rgba(10, 132, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
            }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: '#ADB5BD',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(50, 215, 75, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(50, 215, 75, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#32D74B', marginBottom: '8px', textTransform: 'uppercase' }}>Total Members</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>{members.length}</p>
          </div>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(10, 132, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(10, 132, 255, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0A84FF', marginBottom: '8px', textTransform: 'uppercase' }}>Regular Members</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
              {members.filter(m => m.role === 'member').length}
            </p>
          </div>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FFD700', marginBottom: '8px', textTransform: 'uppercase' }}>Treasurers</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
              {members.filter(m => m.role === 'treasurer').length}
            </p>
          </div>
        </div>

        {/* Members Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {filteredMembers.map((member) => (
            <div 
              key={member.id} 
              style={{
                background: 'rgba(30, 30, 35, 0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                transition: 'all 300ms',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(10, 132, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0A84FF 0%, #00D9C0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)',
                  }}>
                    {member.full_name?.charAt(0) || member.email?.charAt(0) || '?'}
                  </div>
                  <div style={{ marginLeft: '12px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#F8F9FA' }}>
                      {member.full_name || 'Not Set'}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#FF9F0A', textTransform: 'capitalize' }}>{member.role}</p>
                  </div>
                </div>
                {member.role === 'treasurer' && (
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    color: '#FFD700',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}>
                    Admin
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#ADB5BD' }}>
                  <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</span>
                </div>
                {member.phone_number && (
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#ADB5BD' }}>
                    <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{member.phone_number}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contributions</p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#32D74B' }}>
                    KES {member.totalContributions?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Loans</p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#A855F7' }}>
                    {member.activeLoans || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'rgba(30, 30, 35, 0.4)',
            borderRadius: '16px',
            border: '2px dashed rgba(255, 255, 255, 0.1)',
          }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#495057' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#F8F9FA' }}>No members found</h3>
            <p style={{ color: '#ADB5BD', marginTop: '4px' }}>Try adjusting your search terms.</p>
          </div>
        )}
      </main>
    </div>
  );
}
