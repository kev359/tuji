'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function ContributionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    tableBankingAmount: 1000,
    bankSavingsAmount: 1000,
  });

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
    await fetchContributions(user.id);
    setLoading(false);
  };

  const fetchContributions = async (userId) => {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        confirmed_by_profile:profiles!contributions_confirmed_by_fkey(full_name)
      `)
      .eq('member_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contributions:', error);
      return;
    }

    setContributions(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contributions')
        .insert([
          {
            member_id: user.id,
            month: formData.month,
            year: parseInt(formData.year),
            table_banking_amount: parseFloat(formData.tableBankingAmount),
            bank_savings_amount: parseFloat(formData.bankSavingsAmount),
            status: 'pending',
          },
        ]);

      if (error) throw error;

      await fetchContributions(user.id);
      
      setFormData({
        month: '',
        year: new Date().getFullYear(),
        tableBankingAmount: 1000,
        bankSavingsAmount: 1000,
      });
      
      setShowModal(false);
      alert('Contribution recorded successfully! Awaiting treasurer confirmation.');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

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
            border: '3px solid rgba(0, 217, 192, 0.2)',
            borderTop: '3px solid #00D9C0',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}></div>
          <p style={{ color: '#4DFFEA', marginTop: '16px', fontWeight: '500' }}>Loading contributions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 2 }}>
      <Navbar />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              My Contributions
            </h1>
            <p style={{ color: '#ADB5BD', marginTop: '8px' }}>Track your monthly contributions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 100%)',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 159, 10, 0.3)',
              transition: 'all 300ms',
            }}
          >
            💰 Record Contribution
          </button>
        </div>

        {/* Contributions Table */}
        <div style={{
          background: 'rgba(30, 30, 35, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          marginBottom: '24px',
        }}>
          {contributions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                background: 'rgba(0, 217, 192, 0.1)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg style={{ width: '32px', height: '32px', color: '#00D9C0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 style={{ color: '#F8F9FA', fontWeight: '600', marginBottom: '8px' }}>No contributions yet</h3>
              <p style={{ color: '#ADB5BD', marginBottom: '24px' }}>Get started by recording your first contribution.</p>
              <button 
                onClick={() => setShowModal(true)} 
                style={{
                  background: 'linear-gradient(135deg, #FF9F0A 0%, #FF0A78 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 159, 10, 0.3)',
                }}
              >
                Record First Contribution
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Period</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Table Banking</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Bank Savings</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Total</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Confirmed By</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((contribution) => {
                    const total = parseFloat(contribution.table_banking_amount || 0) + 
                                parseFloat(contribution.bank_savings_amount || 0);
                    
                    return (
                      <tr key={contribution.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px', color: '#F8F9FA', fontWeight: '500' }}>
                          {contribution.month} {contribution.year}
                        </td>
                        <td style={{ padding: '16px', color: '#00D9C0' }}>
                          KES {parseFloat(contribution.table_banking_amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', color: '#0A84FF' }}>
                          KES {parseFloat(contribution.bank_savings_amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', color: '#FF9F0A', fontWeight: '600' }}>
                          KES {total.toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: contribution.status === 'confirmed' 
                              ? 'rgba(50, 215, 75, 0.2)' 
                              : 'rgba(255, 159, 10, 0.2)',
                            color: contribution.status === 'confirmed' ? '#32D74B' : '#FF9F0A',
                            border: `1px solid ${contribution.status === 'confirmed' ? 'rgba(50, 215, 75, 0.3)' : 'rgba(255, 159, 10, 0.3)'}`,
                          }}>
                            {contribution.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#ADB5BD' }}>
                          {contribution.confirmed_by_profile?.full_name || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(50, 215, 75, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(50, 215, 75, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#32D74B', marginBottom: '8px', textTransform: 'uppercase' }}>Total Contributed</p>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#F8F9FA' }}>
              KES {contributions.reduce((sum, c) => 
                sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0), 
                0
              ).toLocaleString()}
            </p>
          </div>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(0, 217, 192, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 217, 192, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#00D9C0', marginBottom: '8px', textTransform: 'uppercase' }}>Confirmed</p>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#F8F9FA' }}>
              KES {contributions.filter(c => c.status === 'confirmed').reduce((sum, c) => 
                sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0), 
                0
              ).toLocaleString()}
            </p>
          </div>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 159, 10, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 159, 10, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FF9F0A', marginBottom: '8px', textTransform: 'uppercase' }}>Pending</p>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#F8F9FA' }}>
              KES {contributions.filter(c => c.status === 'pending').reduce((sum, c) => 
                sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0), 
                0
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50,
        }}>
          <div style={{
            background: 'rgba(30, 30, 35, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
            maxWidth: '480px',
            width: '100%',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#F8F9FA',
              }}>Record Contribution</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255, 69, 58, 0.1)',
                  border: '1px solid rgba(255, 69, 58, 0.3)',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#FF453A',
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Month
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 15, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#F8F9FA',
                    fontSize: '1rem',
                  }}
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 15, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#F8F9FA',
                    fontSize: '1rem',
                  }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Table Banking Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.tableBankingAmount}
                  onChange={(e) => setFormData({ ...formData, tableBankingAmount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 15, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#F8F9FA',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Bank Savings Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.bankSavingsAmount}
                  onChange={(e) => setFormData({ ...formData, bankSavingsAmount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 15, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#F8F9FA',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{
                background: 'rgba(255, 159, 10, 0.1)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 159, 10, 0.2)',
              }}>
                <p style={{ fontSize: '0.875rem', color: '#ADB5BD' }}>Total Amount:</p>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#FF9F0A' }}>
                  KES {(parseFloat(formData.tableBankingAmount || 0) + 
                       parseFloat(formData.bankSavingsAmount || 0)).toLocaleString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    background: 'transparent',
                    color: '#ADB5BD',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: '0 8px 24px rgba(0, 217, 192, 0.3)',
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
