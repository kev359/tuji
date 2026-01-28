'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contributions');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [pendingContributions, setPendingContributions] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    notes: '',
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

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData?.role !== 'treasurer') {
      alert('Access denied. This page is only for treasurers.');
      router.push('/dashboard');
      return;
    }

    setUser(user);
    setProfile(profileData);
    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    await Promise.all([
      loadPendingContributions(),
      loadPendingLoans(),
      loadActiveLoans(),
    ]);
  };

  const loadPendingContributions = async () => {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        member:profiles!contributions_member_id_fkey(full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error) {
      setPendingContributions(data || []);
    }
  };

  const loadPendingLoans = async () => {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        member:profiles!loans_member_id_fkey(full_name, email)
      `)
      .eq('status', 'pending')
      .order('request_date', { ascending: false });

    if (!error) {
      setPendingLoans(data || []);
    }
  };

  const loadActiveLoans = async () => {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        member:profiles!loans_member_id_fkey(full_name, email)
      `)
      .eq('status', 'active')
      .order('approved_date', { ascending: false });

    if (!error) {
      setActiveLoans(data || []);
    }
  };

  const confirmContribution = async (contributionId) => {
    if (!confirm('Confirm this contribution?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('contributions')
      .update({
        status: 'confirmed',
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', contributionId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadAllData();
      alert('Contribution confirmed successfully!');
    }
    setLoading(false);
  };

  const approveLoan = async (loanId) => {
    if (!confirm('Approve this loan request?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('loans')
      .update({
        status: 'active',
        approved_by: user.id,
        approved_date: new Date().toISOString(),
      })
      .eq('id', loanId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadAllData();
      alert('Loan approved successfully!');
    }
    setLoading(false);
  };

  const rejectLoan = async (loanId) => {
    if (!confirm('Reject this loan request? This action cannot be undone.')) return;

    setLoading(true);
    const { error } = await supabase
      .from('loans')
      .update({
        status: 'rejected',
        approved_by: user.id,
        approved_date: new Date().toISOString(),
      })
      .eq('id', loanId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      await loadAllData();
      alert('Loan rejected.');
    }
    setLoading(false);
  };

  const openPaymentModal = (loan) => {
    setSelectedLoan(loan);
    setPaymentData({ amount: '', notes: '' });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(paymentData.amount);

    try {
      // Insert payment record
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert([{
          loan_id: selectedLoan.id,
          amount: amount,
          recorded_by: user.id,
          notes: paymentData.notes,
        }]);

      if (paymentError) throw paymentError;

      // Update loan
      const newAmountPaid = parseFloat(selectedLoan.amount_paid || 0) + amount;
      const newBalance = parseFloat(selectedLoan.balance || 0) - amount;

      const updateData = {
        amount_paid: newAmountPaid,
      };

      if (newBalance <= 0) {
        updateData.status = 'completed';
      }

      const { error: updateError } = await supabase
        .from('loans')
        .update(updateData)
        .eq('id', selectedLoan.id);

      if (updateError) throw updateError;

      await loadAllData();
      setShowPaymentModal(false);
      
      if (newBalance <= 0) {
        alert('Payment recorded! Loan is now fully paid and marked as completed.');
      } else {
        alert('Payment recorded successfully!');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
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
            border: '3px solid rgba(255, 159, 10, 0.2)',
            borderTop: '3px solid #FF9F0A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}></div>
          <p style={{ color: '#FFB84D', marginTop: '16px', fontWeight: '500' }}>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const pendingCount = pendingContributions.length + pendingLoans.length;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 2 }}>
      <Navbar />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FF9F0A 0%, #FF453A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Treasurer Panel
              </h1>
              <p style={{ color: '#ADB5BD', marginTop: '8px' }}>Manage contributions, loans, and payments</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '700',
              boxShadow: '0 8px 20px rgba(255, 160, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>Pending Actions</span>
              <span style={{ fontSize: '1.5rem', lineHeight: '1' }}>{pendingCount}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'rgba(30, 30, 35, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          overflowX: 'auto',
          padding: '8px',
        }}>
          {[
            { id: 'contributions', label: `Pending Contributions (${pendingContributions.length})`, color: '#32D74B' },
            { id: 'loans', label: `Pending Loans (${pendingLoans.length})`, color: '#A855F7' },
            { id: 'payments', label: `Record Payment`, color: '#0A84FF' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.875rem',
                background: activeTab === tab.id ? `${tab.color}22` : 'transparent',
                color: activeTab === tab.id ? tab.color : '#ADB5BD',
                border: activeTab === tab.id ? `1px solid ${tab.color}44` : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pending Contributions Tab */}
        {activeTab === 'contributions' && (
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>Pending Contributions</h2>
            {pendingContributions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#ADB5BD' }}>
                No pending contributions
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Member</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Period</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amounts</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingContributions.map((contrib) => (
                      <tr key={contrib.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px', color: '#F8F9FA', fontWeight: '500' }}>
                          {contrib.member?.full_name || contrib.member?.email || 'Unknown'}
                        </td>
                        <td style={{ padding: '16px', color: '#ADB5BD' }}>
                          {contrib.month} {contrib.year}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ color: '#00D9C0' }}>Wait: KES {parseFloat(contrib.table_banking_amount || 0).toLocaleString()}</div>
                          <div style={{ color: '#0A84FF' }}>Bank: KES {parseFloat(contrib.bank_savings_amount || 0).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '16px', color: '#ADB5BD', fontSize: '0.875rem' }}>
                          {new Date(contrib.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={() => confirmContribution(contrib.id)}
                            style={{
                              background: 'rgba(50, 215, 75, 0.2)',
                              color: '#32D74B',
                              border: '1px solid rgba(50, 215, 75, 0.4)',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 200ms',
                            }}
                          >
                            Confirm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pending Loans Tab */}
        {activeTab === 'loans' && (
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>Pending Loan Requests</h2>
            {pendingLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#ADB5BD' }}>
                No pending loan requests
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Member</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Details</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Purpose</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLoans.map((loan) => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px', color: '#F8F9FA', fontWeight: '500' }}>
                          {loan.member?.full_name || loan.member?.email || 'Unknown'}
                          <div style={{ fontSize: '0.75rem', color: '#ADB5BD', marginTop: '4px' }}>
                            {new Date(loan.request_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ color: '#A855F7', fontWeight: '600' }}>KES {parseFloat(loan.amount || 0).toLocaleString()}</div>
                          <div style={{ color: '#ADB5BD', fontSize: '0.75rem' }}>+ KES {parseFloat(loan.interest_amount || 0).toLocaleString()} int.</div>
                          <div style={{ color: '#F8F9FA', foneWeight: '700', marginTop: '4px' }}>= KES {parseFloat(loan.total_amount || 0).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '16px', color: '#ADB5BD', maxWidth: '200px' }}>
                          {loan.purpose}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => approveLoan(loan.id)}
                              style={{
                                background: 'rgba(50, 215, 75, 0.2)',
                                color: '#32D74B',
                                border: '1px solid rgba(50, 215, 75, 0.4)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLoan(loan.id)}
                              style={{
                                background: 'rgba(255, 69, 58, 0.2)',
                                color: '#FF453A',
                                border: '1px solid rgba(255, 69, 58, 0.4)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Record Payment Tab */}
        {activeTab === 'payments' && (
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>Active Loans - Record Payment</h2>
            {activeLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#ADB5BD' }}>
                No active loans
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Member</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Loan Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Paid</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Balance</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map((loan) => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '16px', color: '#F8F9FA', fontWeight: '500' }}>
                          {loan.member?.full_name || loan.member?.email || 'Unknown'}
                        </td>
                        <td style={{ padding: '16px', color: '#F8F9FA' }}>
                          KES {parseFloat(loan.total_amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', color: '#32D74B' }}>
                          KES {parseFloat(loan.amount_paid || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', color: '#FF453A', fontWeight: '700' }}>
                          KES {parseFloat(loan.balance || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={() => openPaymentModal(loan)}
                            style={{
                              background: 'rgba(10, 132, 255, 0.2)',
                              color: '#0A84FF',
                              border: '1px solid rgba(10, 132, 255, 0.4)',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 200ms',
                            }}
                          >
                            Pay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
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
              }}>Record Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
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

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#ADB5BD', marginBottom: '4px' }}>
                <strong style={{ color: '#F8F9FA' }}>Member:</strong> {selectedLoan.member?.full_name || 'Unknown'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#ADB5BD' }}>
                <strong style={{ color: '#F8F9FA' }}>Outstanding Balance:</strong> 
                <span style={{ color: '#FF453A', fontWeight: '700', marginLeft: '8px' }}>
                  KES {parseFloat(selectedLoan.balance || 0).toLocaleString()}
                </span>
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Payment Amount (KES)
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  placeholder="Enter payment amount"
                  min="0.01"
                  max={selectedLoan.balance}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Add any notes..."
                  rows="2"
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

              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
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
                    background: 'linear-gradient(135deg, #FF9F0A 0%, #FF453A 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: '0 8px 24px rgba(255, 160, 0, 0.3)',
                  }}
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
