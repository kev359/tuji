'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function LoansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
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
    await fetchLoans(user.id);
    setLoading(false);
  };

  const fetchLoans = async (userId) => {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        approved_by_profile:profiles!loans_approved_by_fkey(full_name)
      `)
      .eq('member_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching loans:', error);
      return;
    }

    setLoans(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(formData.amount);
    
    if (amount < 100) {
      alert('Minimum loan amount is KES 100');
      setLoading(false);
      return;
    }

    if (formData.purpose.length < 5) {
      alert('Please provide a purpose (at least 5 characters)');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('loans')
        .insert([
          {
            member_id: user.id,
            amount: amount,
            purpose: formData.purpose,
            status: 'pending',
          },
        ]);

      if (error) throw error;

      await fetchLoans(user.id);
      
      setFormData({
        amount: '',
        purpose: '',
      });
      
      setShowModal(false);
      alert('Loan request submitted successfully! Awaiting treasurer approval.');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FF9F0A',
      approved: '#32D74B',
      active: '#A855F7',
      completed: '#0A84FF',
      rejected: '#FF453A',
    };
    return colors[status] || '#ADB5BD';
  };

  const calculateInterest = () => {
    const amount = parseFloat(formData.amount) || 0;
    return amount * 0.10;
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    return amount + (amount * 0.10);
  };

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
            border: '3px solid rgba(168, 85, 247, 0.2)',
            borderTop: '3px solid #A855F7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}></div>
          <p style={{ color: '#C084FC', marginTop: '16px', fontWeight: '500' }}>Loading loans...</p>
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
              background: 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              My Loans
            </h1>
            <p style={{ color: '#ADB5BD', marginTop: '8px' }}>Track your loan requests and repayments</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 217, 192, 0.3)',
              transition: 'all 300ms',
            }}
          >
            🏦 Request Loan
          </button>
        </div>

        {/* Info Box */}
        <div style={{
          background: 'rgba(10, 132, 255, 0.1)',
          border: '1px solid rgba(10, 132, 255, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
        }}>
          <svg style={{ width: '24px', height: '24px', color: '#0A84FF', marginTop: '2px', marginRight: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64B5F6' }}>Loan Information</p>
            <p style={{ fontSize: '0.875rem', color: '#CAD5E2', marginTop: '4px' }}>
              All loans carry a 10% interest rate. Repayment is tracked by the treasurer.
            </p>
          </div>
        </div>

        {/* Loans Table */}
        <div style={{
          background: 'rgba(30, 30, 35, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          marginBottom: '24px',
        }}>
          {loans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg style={{ width: '32px', height: '32px', color: '#A855F7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 style={{ color: '#F8F9FA', fontWeight: '600', marginBottom: '8px' }}>No loans yet</h3>
              <p style={{ color: '#ADB5BD', marginBottom: '24px' }}>Get started by requesting your first loan.</p>
              <button 
                onClick={() => setShowModal(true)} 
                style={{
                  background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0, 217, 192, 0.3)',
                }}
              >
                Request First Loan
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Interest (10%)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Due</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Balance</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '16px', color: '#F8F9FA' }}>
                        {new Date(loan.request_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', color: '#A855F7' }}>
                        KES {parseFloat(loan.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px', color: '#F8F9FA' }}>
                        KES {parseFloat(loan.interest_amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px', color: '#F8F9FA', fontWeight: '600' }}>
                        KES {parseFloat(loan.total_amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px', color: loan.balance > 0 ? '#FF453A' : '#32D74B', fontWeight: '700' }}>
                        {loan.status === 'active' || loan.status === 'approved' ? (
                          `KES ${parseFloat(loan.balance || 0).toLocaleString()}`
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: `${getStatusColor(loan.status)}33`,
                          color: getStatusColor(loan.status),
                          border: `1px solid ${getStatusColor(loan.status)}66`,
                          textTransform: 'uppercase',
                        }}>
                          {loan.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#ADB5BD', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {loan.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
        }}>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(10, 132, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(10, 132, 255, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0A84FF', marginBottom: '8px', textTransform: 'uppercase' }}>Total Borrowed</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA' }}>
              KES {loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0).toLocaleString()}
            </p>
          </div>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(50, 215, 75, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(50, 215, 75, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#32D74B', marginBottom: '8px', textTransform: 'uppercase' }}>Active Loans</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA' }}>
              {loans.filter(l => l.status === 'active' || l.status === 'approved').length}
            </p>
          </div>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 69, 58, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#FF453A', marginBottom: '8px', textTransform: 'uppercase' }}>Outstanding</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA' }}>
              KES {loans.filter(l => l.status === 'active').reduce((sum, l) => 
                sum + parseFloat(l.balance || 0), 0
              ).toLocaleString()}
            </p>
          </div>
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 85, 247, 0.1)',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#A855F7', marginBottom: '8px', textTransform: 'uppercase' }}>Completed</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA' }}>
              {loans.filter(l => l.status === 'completed').length}
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
              }}>Request Loan</h2>
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
                  Loan Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="100"
                  step="0.01"
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
                />
                <p style={{ fontSize: '0.75rem', color: '#6C757D', marginTop: '6px' }}>Minimum: KES 100</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Purpose
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Describe the purpose of this loan..."
                  rows="3"
                  minLength="5"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(15, 15, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#F8F9FA',
                    fontSize: '1rem',
                    resize: 'none',
                  }}
                ></textarea>
              </div>

              {formData.amount && (
                <div style={{
                  background: 'rgba(255, 159, 10, 0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 159, 10, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#CAD5E2' }}>
                    <span>Loan Amount:</span>
                    <span style={{ fontWeight: '600' }}>KES {parseFloat(formData.amount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#CAD5E2' }}>
                    <span>Interest (10%):</span>
                    <span style={{ fontWeight: '600' }}>KES {calculateInterest().toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ color: '#F8F9FA', fontWeight: '600' }}>Total Repayment:</span>
                    <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#FF9F0A' }}>
                      KES {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                padding: '12px',
              }}>
                <p style={{ fontSize: '0.75rem', color: '#FFD700' }}>
                  <strong>Note:</strong> All loans carry a 10% interest rate. Your request will be reviewed by the treasurer.
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
                    background: 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: '0 8px 24px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
