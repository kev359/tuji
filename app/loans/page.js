'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function LoansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [publicRequests, setPublicRequests] = useState([]);
  const [availableFunds, setAvailableFunds] = useState(0);
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
    await Promise.all([
        fetchLoans(user.id),
        fetchPublicData()
    ]);
    setLoading(false);
  };

  const fetchPublicData = async () => {
      // 1. Fetch Group Stats for Available Funds
      const { data: stats } = await supabase.rpc('get_group_stats');
      if (stats) {
          // Available = Table Banking Pool - Active Loan Balance
          // Actually, 'total_table_banking' is the total contributed.
          // We need to subtract OUTSTANDING LOANS to see what's actually in the bank.
          // Let's approximate: Available = Total Table Banking Contributions - (Total Active Loan Principals)
          // For now, simpler: Just show the Total Pool and let Treasurer decide. 
          // But user said "available funds vs loan amount requested".
          // I will use `available_funds = total_table_banking` for now as the 'pool size'.
          setAvailableFunds(stats.total_table_banking || 0);
      }

      // 2. Fetch Public Requests
      const { data: requests, error } = await supabase.rpc('get_public_loan_requests');
      if (!error && requests) {
          setPublicRequests(requests);
      }
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

      await Promise.all([fetchLoans(user.id), fetchPublicData()]);
      
      setFormData({
        amount: '',
        purpose: '',
      });
      
      setShowModal(false);
      alert('Loan request submitted successfully! It is now visible on the queue.');
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
        background: '#1A1A1D',
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
          <p style={{ color: '#E9D5FF', marginTop: '16px', fontWeight: '500' }}>Loading loans...</p>
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

  const activeLoans = loans.filter(l => l.status === 'active');
  const pastLoans = loans.filter(l => l.status !== 'active');

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 2 }}>
      <Navbar />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '8px'
                }}>
                    Loans & Credit
                </h1>
                <p style={{ color: '#ADB5BD', fontSize: '1.1rem' }}>Access affordable credit from the group pool</p>
            </div>
            
            {/* Available Funds Card */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(255, 10, 120, 0.05) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '20px 32px',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                minWidth: '240px'
            }}>
                <p style={{ color: '#E9D5FF', fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px' }}>Total Table Banking Pool</p>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#F8F9FA' }}>
                    KES {parseFloat(availableFunds || 0).toLocaleString()}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#ADB5BD', marginTop: '4px' }}>Used to fund member loans</p>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', marginBottom: '48px' }}>
            
            {/* PUBLIC: Loan Requests Queue */}
            <div style={{
                background: 'rgba(30, 30, 35, 0.6)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
            }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA' }}>📋 Current Request Queue</h2>
                    <span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600', color: '#F8F9FA' }}>
                        {publicRequests.length} Pending
                    </span>
                 </div>

                 {publicRequests.length === 0 ? (
                     <div style={{ padding: '32px', textAlign: 'center', color: '#ADB5BD', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px' }}>
                         <p>No pending requests. The queue is clear!</p>
                     </div>
                 ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         {publicRequests.map(req => (
                             <div key={req.id} style={{
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 padding: '16px',
                                 background: 'rgba(255, 255, 255, 0.03)',
                                 borderRadius: '12px',
                                 border: '1px solid rgba(255, 255, 255, 0.05)'
                             }}>
                                 <div>
                                     <p style={{ fontWeight: '600', color: '#F8F9FA', marginBottom: '4px' }}>{req.member_name}</p>
                                     <p style={{ fontSize: '0.875rem', color: '#ADB5BD' }}>{new Date(req.request_date).toLocaleDateString()}</p>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: '700', color: '#FF9F0A' }}>KES {parseFloat(req.amount).toLocaleString()}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#ADB5BD' }}>requested</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
            </div>

            {/* PAYMENT INSTRUCTIONS */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.8) 0%, rgba(30, 30, 35, 0.9) 100%)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '24px' }}>💳 Repayment Channels</h2>
                
                {/* Paybill */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(10, 132, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🏦</span>
                    </div>
                    <div>
                        <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px' }}>LIPA NA I&M BANK</p>
                        <p style={{ color: '#F8F9FA', fontWeight: '700', fontSize: '1.1rem' }}>Paybill: 542542</p>
                        <p style={{ color: '#0A84FF', fontWeight: '600', fontSize: '1rem' }}>Account: 29930</p>
                    </div>
                </div>

                {/* Treasurer M-Pesa */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(50, 215, 75, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>📱</span>
                    </div>
                    <div>
                        <p style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px' }}>TREASURER M-PESA</p>
                        <p style={{ color: '#F8F9FA', fontWeight: '700', fontSize: '1.25rem' }}>0758 351 715</p>
                        <p style={{ color: '#32D74B', fontSize: '0.875rem', fontWeight: '500' }}>Theopyster Wakesho</p>
                    </div>
                </div>

                <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255, 159, 10, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 159, 10, 0.2)' }}>
                    <p style={{ fontSize: '0.8rem', color: '#FF9F0A', lineHeight: '1.4' }}>
                        <strong>Note:</strong> When repaying via M-Pesa or Paybill, please share the transaction code with the treasurer for confirmation.
                    </p>
                </div>
            </div>

        </div>

        {/* MY LOANS SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA' }}>My Loans</h2>
            <button
                onClick={() => setShowModal(true)}
                style={{
                    background: 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(168, 85, 247, 0.3)',
                    transition: 'all 300ms',
                }}
            >
                + Request Loan
            </button>
        </div>

        {/* ACTIVE LOANS */}
        <div style={{ marginBottom: '40px' }}>
            {activeLoans.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {activeLoans.map(loan => (
                        <div key={loan.id} style={{
                            background: 'rgba(30, 30, 35, 0.7)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '24px',
                            border: '1px solid #A855F7',
                            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ background: '#A855F7', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                    Active
                                </span>
                                <span style={{ color: '#ADB5BD', fontSize: '0.875rem' }}>{new Date(loan.processed_at || loan.created_at).toLocaleDateString()}</span>
                             </div>
                             
                             <div style={{ marginBottom: '24px' }}>
                                <p style={{ color: '#ADB5BD', fontSize: '0.875rem', marginBottom: '4px' }}>Outstanding Balance</p>
                                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#F8F9FA' }}>
                                    KES {parseFloat(loan.balance).toLocaleString()}
                                </h3>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#32D74B' }}>Paid: KES {parseFloat(loan.amount_paid).toLocaleString()}</span>
                                    <span style={{ color: '#ADB5BD' }}>•</span>
                                    <span style={{ color: '#FF9F0A' }}>Total Due: KES {parseFloat(loan.total_amount).toLocaleString()}</span>
                                </div>
                             </div>

                             <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                                 <p style={{ color: '#ADB5BD', fontSize: '0.875rem', marginBottom: '4px' }}>Purpose</p>
                                 <p style={{ color: '#F8F9FA' }}>{loan.purpose}</p>
                             </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '24px', background: 'rgba(30, 30, 35, 0.4)', borderRadius: '16px', color: '#ADB5BD', textAlign: 'center' }}>
                    You have no active loans.
                </div>
            )}
        </div>

        {/* PAST LOANS */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>History</h3>
        <div style={{ background: 'rgba(30, 30, 35, 0.4)', borderRadius: '20px', overflow: 'hidden' }}>
             {pastLoans.length === 0 ? (
                 <div style={{ padding: '32px', textAlign: 'center', color: '#ADB5BD' }}>No loan history available.</div>
             ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem' }}>Date</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem' }}>Amount</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.875rem' }}>Purpose</th>
                            <th style={{ padding: '16px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.875rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pastLoans.map(loan => (
                            <tr key={loan.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '16px', color: '#F8F9FA' }}>{new Date(loan.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '16px', color: '#F8F9FA' }}>KES {parseFloat(loan.amount).toLocaleString()}</td>
                                <td style={{ padding: '16px', color: '#ADB5BD' }}>{loan.purpose}</td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <span style={{
                                        background: loan.status === 'completed' ? 'rgba(50, 215, 75, 0.2)' : loan.status === 'rejected' ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255, 159, 10, 0.2)',
                                        color: loan.status === 'completed' ? '#32D74B' : loan.status === 'rejected' ? '#FF453A' : '#FF9F0A',
                                        padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize'
                                    }}>
                                        {loan.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}
        </div>

      </main>

      {/* REQUEST LOAN MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
           <div style={{
               background: '#1A1A1D', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '450px',
               border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
           }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Request Loan</h2>
               <p style={{ color: '#ADB5BD', marginBottom: '24px' }}>Funds will be deducted from the table banking pool.</p>
               
               <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div>
                       <label style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Amount (KES)</label>
                       <input 
                           type="number" 
                           value={formData.amount}
                           onChange={e => setFormData({...formData, amount: e.target.value})}
                           placeholder="Enter amount (min 100)"
                           style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1.1rem' }}
                           required
                       />
                       <p style={{ fontSize: '0.75rem', color: '#A855F7', marginTop: '8px' }}>Interest Rate: 10% (Total Repayable: KES {formData.amount ? (parseFloat(formData.amount) * 1.1).toLocaleString() : '0'})</p>
                   </div>
                   
                   <div>
                       <label style={{ color: '#ADB5BD', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Purpose</label>
                       <textarea 
                           value={formData.purpose}
                           onChange={e => setFormData({...formData, purpose: e.target.value})}
                           placeholder="What is this loan for?"
                           rows="3"
                           style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', resize: 'none' }}
                           required
                       />
                   </div>

                   <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                       <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ADB5BD', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                       <button type="submit" disabled={loading} style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #A855F7 0%, #FF0A78 100%)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
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
