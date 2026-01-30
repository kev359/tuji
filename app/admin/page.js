'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contributions');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [pendingContributions, setPendingContributions] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    notes: '',
  });

  // Member Details Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberStats, setMemberStats] = useState({
    contributions: [],
    loans: [],
    totalSavings: 0,
    totalTableBanking: 0,
    loanBalance: 0
  });

  // New Contribution State
  const [newContribution, setNewContribution] = useState({
    member_id: '',
    month: '',
    year: new Date().getFullYear(),
    table_banking: 1000,
    bank_savings: 1000,
    payment_method: 'cash',
    reference_code: '',
  });

  const [complianceMonth, setComplianceMonth] = useState('');
  const [complianceYear, setComplianceYear] = useState(new Date().getFullYear());
  const [complianceResults, setComplianceResults] = useState([]);

  // Reports State
  const [reportType, setReportType] = useState('monthly'); // monthly, loans, summary
  const [reportData, setReportData] = useState([]);
  const [reportMonth, setReportMonth] = useState('');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    checkAuth();
  }, []);

  const runComplianceCheck = async () => {
      if (!complianceMonth) {
          alert('Please select a month');
          return;
      }
      if (!confirm(`Are you sure you want to run the compliance check for ${complianceMonth} ${complianceYear}? This will create loans for anyone who has missed the Table Banking contribution.`)) {
          return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('process_monthly_defaults', {
            p_month: complianceMonth,
            p_year: parseInt(complianceYear)
        });

        if (error) throw error;
        setComplianceResults(data || []);
        alert('Compliance check complete. Check the results below.');
      } catch (err) {
          alert('Error: ' + err.message);
      } finally {
          setLoading(false);
      }
  };

  const generateReport = async () => {
      setLoading(true);
      setReportData([]);
      try {
          let rpcName = '';
          let params = {};

          if (reportType === 'monthly') {
              if (!reportMonth) { alert('Select a month'); setLoading(false); return; }
              rpcName = 'get_monthly_comprehensive_report';
              params = { p_month: reportMonth, p_year: parseInt(reportYear) };
          } else if (reportType === 'loans') {
              rpcName = 'get_loan_risk_report';
          } else if (reportType === 'summary') {
              rpcName = 'get_member_financial_summary';
          }

          const { data, error } = await supabase.rpc(rpcName, params);
          if (error) throw error;
          setReportData(data || []);
      } catch (e) {
          alert('Error: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const downloadPDF = () => {
    if (reportData.length === 0) { alert('No data to export!'); return; }
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Tujiimarishe Group Report: ${reportType.toUpperCase()}`, 14, 20);
    
    doc.setFontSize(12);
    if (reportType === 'monthly') doc.text(`Period: ${reportMonth} ${reportYear}`, 14, 28);
    else doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    let head = [];
    let body = [];

    if (reportType === 'monthly') {
        head = [['Member', 'Table Banking', 'Savings', 'Loans Taken', 'Repayments', 'Net Group Flow']];
         body = reportData.map(r => [
            r.member_name, 
            (parseFloat(r.table_banking)||0).toLocaleString(), 
            (parseFloat(r.bank_savings)||0).toLocaleString(), 
            (parseFloat(r.loans_taken)||0).toLocaleString(), 
            (parseFloat(r.total_repaid)||0).toLocaleString(), 
            (parseFloat(r.net_activity)||0).toLocaleString()
        ]);
    } else if (reportType === 'loans') {
        head = [['Member', 'Borrowed', 'To Pay', 'Paid', 'Balance', 'Status']];
        body = reportData.map(r => [
            r.member_name,
            parseFloat(r.amount_borrowed).toLocaleString(),
            parseFloat(r.total_repayable).toLocaleString(),
            parseFloat(r.amount_paid).toLocaleString(),
            parseFloat(r.balance).toLocaleString(),
            r.status
        ]);
    } else if (reportType === 'summary') {
         head = [['Member', 'Total Shares', 'Total Savings', 'Loan Debt', 'Net Standing']];
         body = reportData.map(r => [
             r.member_name,
             parseFloat(r.total_shares).toLocaleString(),
             parseFloat(r.total_savings).toLocaleString(),
             parseFloat(r.active_loan_balance).toLocaleString(),
             (parseFloat(r.total_shares) + parseFloat(r.total_savings) - parseFloat(r.active_loan_balance)).toLocaleString()
         ]);
    }

    doc.autoTable({
        startY: 35,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`tuji_report_${reportType}_${new Date().getTime()}.pdf`);
  };

  const openMemberDetails = async (member) => {
    setLoading(true);
    setSelectedMember(member);
    
    // Fetch Member Contributions
    const { data: contributions } = await supabase
      .from('contributions')
      .select('*')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false });
      
    // Fetch Member Loans
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('member_id', member.id)
      .order('request_date', { ascending: false });

    // Calculate Stats
    const totalTableBanking = contributions?.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + (c.table_banking_amount || 0), 0) || 0;
    const totalSavings = contributions?.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + (c.bank_savings_amount || 0), 0) || 0;
    const loanBalance = loans?.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.balance || 0), 0) || 0;

    setMemberStats({
      contributions: contributions || [],
      loans: loans || [],
      totalTableBanking,
      totalSavings,
      loanBalance
    });
    
    setLoading(false);
    setShowMemberModal(true);
  };

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

    if (profileData?.role !== 'treasurer' && profileData?.role !== 'admin') {
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
      loadMembers(),
    ]);
  };

  const loadMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name');
    setAllMembers(data || []);
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

  const handleNewContributionSubmit = async (e) => {
    e.preventDefault();
    if (!newContribution.member_id || !newContribution.month) {
      alert('Please select a member and a month');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contributions')
        .insert([{
          member_id: newContribution.member_id,
          month: newContribution.month,
          year: parseInt(newContribution.year),
          table_banking_amount: parseFloat(newContribution.table_banking),
          bank_savings_amount: parseFloat(newContribution.bank_savings),
          payment_method: newContribution.payment_method,
          reference_code: newContribution.reference_code,
          status: 'confirmed', // Auto-confirm since admin is adding it
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
        }]);

      if (error) throw error;
      
      alert('Contribution recorded successfully!');
      setNewContribution({
        member_id: '',
        month: '',
        year: new Date().getFullYear(),
        table_banking: 1000,
        bank_savings: 1000,
        payment_method: 'cash',
        reference_code: '',
      });
      await loadAllData();
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
          gap: '8px',
        }}>
          {[
            { id: 'new_contribution', label: `+ Record Contribution`, color: '#00D9C0' },
            { id: 'contributions', label: `Pending Contribs (${pendingContributions.length})`, color: '#32D74B' },
            { id: 'loans', label: `Pending Loans (${pendingLoans.length})`, color: '#A855F7' },
            { id: 'payments', label: `Record Loan Payment`, color: '#0A84FF' },
            { id: 'members_accounts', label: `Member Accounts`, color: '#FFD700' },
            { id: 'defaults', label: `⚠️ Check Defaults`, color: '#EF4444' },
            { id: 'reports', label: `📄 Reports`, color: '#6366F1' }
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
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Member Accounts Tab */}
        {activeTab === 'members_accounts' && (
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>All Member Accounts</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Member Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ADB5BD', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allMembers.map((member) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '16px', color: '#F8F9FA', fontWeight: '500' }}>
                        {member.full_name}
                        <div style={{ fontSize: '0.75rem', color: '#ADB5BD', marginTop: '4px' }}>{member.email}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                         <span style={{ 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontSize: '0.75rem',
                            color: '#ADB5BD',
                            textTransform: 'capitalize' 
                          }}>
                            {member.role || 'Member'}
                          </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => openMemberDetails(member)}
                          style={{
                            background: 'rgba(255, 215, 0, 0.1)',
                            color: '#FFD700',
                            border: '1px solid rgba(255, 215, 0, 0.4)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                          }}
                        >
                          View Statement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Defaults Check Tab */}
        {activeTab === 'defaults' && (
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            boxShadow: '0 8px 32px rgba(255, 69, 58, 0.1)',
          }}>
             <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>⚠️ Run Compliance Check</h2>
             <p style={{ color: '#ADB5BD', marginBottom: '24px' }}>
                This tool checks for members who have NOT contributed the mandatory Table Banking (KES 1,000) by the 8th of the selected month.
                <br/>
                It automatically creates a <strong>Loan of KES 1,000 + 10% Interest</strong> for defaulters.
             </p>

             <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                 <select 
                    value={complianceMonth} 
                    onChange={e => setComplianceMonth(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333' }}
                 >
                     <option value="">Select Month</option>
                     {months.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <select 
                    value={complianceYear} 
                    onChange={e => setComplianceYear(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333' }}
                 >
                     <option value="2025">2025</option>
                     <option value="2026">2026</option>
                 </select>
                 <button 
                    onClick={runComplianceCheck}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        background: '#EF4444',
                        color: 'white',
                        fontWeight: '700',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                 >
                    {loading ? 'Analyzing...' : '⚠️ Check & Penalize Defaults'}
                 </button>
             </div>

             {complianceResults.length > 0 && (
                <div style={{ marginTop: '24px', overflowX: 'auto' }}>
                    <h3 style={{ color: '#F8F9FA', marginBottom: '12px' }}>Results</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: '#ADB5BD', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '8px' }}>Member</th>
                                <th style={{ padding: '8px' }}>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complianceResults.map((res, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', color: '#F8F9FA' }}>{res.member_name}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            color: res.result.includes('Created') ? '#EF4444' : res.result.includes('Paid') ? '#32D74B' : '#F59E0B',
                                            fontWeight: '600'
                                        }}>
                                            {res.result}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
           <div style={{ background: 'rgba(30, 30, 35, 0.7)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px' }}>📄 Generate Reports</h2>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333' }}>
                      <option value="monthly">Monthly Contributions</option>
                      <option value="loans">Loan Risk Analysis</option>
                      <option value="summary">Member Financial Summary</option>
                  </select>

                  {reportType === 'monthly' && (
                     <>
                        <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333' }}>
                           <option value="">Select Month</option>
                           {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={reportYear} onChange={e => setReportYear(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #333' }}>
                           <option value="2025">2025</option>
                           <option value="2026">2026</option>
                        </select>
                     </>
                  )}

                  <button onClick={generateReport} disabled={loading} style={{ padding: '12px 24px', background: '#6366F1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? 'Generating...' : 'Generate View'}
                  </button>
                  {reportData.length > 0 && (
                      <button onClick={downloadPDF} style={{ padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginLeft: 'auto' }}>
                          ⬇️ Export to PDF
                      </button>
                  )}
              </div>

              {/* Dynamic Table */}
              {reportData.length > 0 ? (
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <tr style={{ textAlign: 'left', color: '#ADB5BD' }}>
                                  {/* Headers based on Type */}
                                  {reportType === 'monthly' && (
                                     <>
                                        <th style={{ padding: '12px' }}>Member</th>
                                        <th style={{ padding: '12px' }}>Table Banking</th>
                                        <th style={{ padding: '12px' }}>Savings</th>
                                        <th style={{ padding: '12px' }}>Total Contrib</th>
                                        <th style={{ padding: '12px' }}>Loans Taken</th>
                                        <th style={{ padding: '12px' }}>Repayments</th>
                                        <th style={{ padding: '12px' }}>Net Cash Flow</th>
                                     </>
                                  )}
                                  {reportType === 'loans' && (
                                     <>
                                        <th style={{ padding: '12px' }}>Member</th>
                                        <th style={{ padding: '12px' }}>Borrowed</th>
                                        <th style={{ padding: '12px' }}>Repayable</th>
                                        <th style={{ padding: '12px' }}>Paid</th>
                                        <th style={{ padding: '12px' }}>Balance</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Date</th>
                                     </>
                                  )}
                                  {reportType === 'summary' && (
                                     <>
                                        <th style={{ padding: '12px' }}>Member</th>
                                        <th style={{ padding: '12px' }}>Total Shares</th>
                                        <th style={{ padding: '12px' }}>Total Savings</th>
                                        <th style={{ padding: '12px' }}>Active Loan Bal</th>
                                        <th style={{ padding: '12px' }}>Net Standing</th>
                                     </>
                                  )}
                              </tr>
                          </thead>
                          <tbody>
                              {reportData.map((row, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                      <td style={{ padding: '12px', color: '#F8F9FA' }}>{row.member_name}</td>
                                      
                                      {reportType === 'monthly' && (
                                         <>
                                            <td style={{ padding: '12px', color: '#32D74B' }}>{parseFloat(row.table_banking||0).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: '#A855F7' }}>{parseFloat(row.bank_savings||0).toLocaleString()}</td>
                                            <td style={{ padding: '12px', fontWeight: '700', color: '#F8F9FA' }}>{parseFloat(row.total_contributions||0).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: '#EF4444' }}>{parseFloat(row.loans_taken||0).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: '#10B981' }}>{parseFloat(row.total_repaid||0).toLocaleString()}</td>
                                            <td style={{ padding: '12px', fontWeight: '700' }}>{parseFloat(row.net_activity||0).toLocaleString()}</td>
                                         </>
                                      )}

                                      {reportType === 'loans' && (
                                         <>
                                            <td style={{ padding: '12px' }}>{parseFloat(row.amount_borrowed).toLocaleString()}</td>
                                            <td style={{ padding: '12px' }}>{parseFloat(row.total_repayable).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: '#32D74B' }}>{parseFloat(row.amount_paid).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: '#EF4444', fontWeight: '700' }}>{parseFloat(row.balance).toLocaleString()}</td>
                                            <td style={{ padding: '12px', textTransform: 'uppercase' }}>{row.status}</td>
                                            <td style={{ padding: '12px' }}>{new Date(row.loan_date).toLocaleDateString()}</td>
                                         </>
                                      )}

                                      {reportType === 'summary' && (
                                         <>
                                            <td style={{ padding: '12px', color: '#32D74B' }}>{parseFloat(row.total_shares).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: '#A855F7' }}>{parseFloat(row.total_savings).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: '#EF4444' }}>{parseFloat(row.active_loan_balance).toLocaleString()}</td>
                                            <td style={{ padding: '12px', fontWeight: '700', color: '#F8F9FA' }}>
                                                {(parseFloat(row.total_shares) + parseFloat(row.total_savings) - parseFloat(row.active_loan_balance)).toLocaleString()}
                                            </td>
                                         </>
                                      )}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#ADB5BD', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      Click 'Generate View' to see data.
                  </div>
              )}
           </div>
        )}

        {/* Record New Contribution Tab */}
        {activeTab === 'new_contribution' && (
          <div style={{
            background: 'rgba(30, 30, 35, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '24px', textAlign: 'center' }}>
              Record Member Contribution
            </h2>
            <form onSubmit={handleNewContributionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Member Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                  Select Member
                </label>
                <select
                  value={newContribution.member_id}
                  onChange={(e) => setNewContribution({ ...newContribution, member_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(15, 15, 20, 0.8)',
                    color: '#F8F9FA',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {allMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                  ))}
                </select>
              </div>

              {/* Month Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                    Month
                  </label>
                  <select
                    value={newContribution.month}
                    onChange={(e) => setNewContribution({ ...newContribution, month: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(15, 15, 20, 0.8)',
                      color: '#F8F9FA',
                      outline: 'none',
                    }}
                    required
                  >
                    <option value="">Select Month</option>
                    {months.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={newContribution.year}
                    onChange={(e) => setNewContribution({ ...newContribution, year: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(15, 15, 20, 0.8)',
                      color: '#F8F9FA',
                    }}
                    required
                  />
                </div>
              </div>

              {/* Payment Method Section */}
              <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '12px' }}>Payment Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '6px' }}>
                      Method
                    </label>
                    <select
                      value={newContribution.payment_method}
                      onChange={(e) => setNewContribution({ ...newContribution, payment_method: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.2)',
                        color: '#F8F9FA',
                        outline: 'none',
                      }}
                    >
                      <option value="cash">💵 Cash (to Treasurer)</option>
                      <option value="mpesa">📱 M-Pesa (to Treasurer)</option>
                      <option value="paybill">🏦 Paybill (I&M Bank)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '6px' }}>
                      Reference Code
                    </label>
                    <input
                      type="text"
                      value={newContribution.reference_code}
                      onChange={(e) => setNewContribution({ ...newContribution, reference_code: e.target.value })}
                      placeholder={newContribution.payment_method === 'cash' ? 'Optional' : 'e.g. QWE23...'}
                      disabled={newContribution.payment_method === 'cash'}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: newContribution.payment_method === 'cash' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                        color: '#F8F9FA',
                        outline: 'none',
                        textTransform: 'uppercase',
                        opacity: newContribution.payment_method === 'cash' ? 0.5 : 1,
                      }}
                    />
                  </div>
                </div>

                {/* Info Box based on Selection */}
                {newContribution.payment_method === 'mpesa' && (
                   <div style={{ fontSize: '0.75rem', color: '#32D74B', background: 'rgba(50, 215, 75, 0.1)', padding: '8px', borderRadius: '6px' }}>
                     Send to Treasurer: <strong>0758 351 715</strong>
                   </div>
                )}
                {newContribution.payment_method === 'paybill' && (
                   <div style={{ fontSize: '0.75rem', color: '#0A84FF', background: 'rgba(10, 132, 255, 0.1)', padding: '8px', borderRadius: '6px' }}>
                     Paybill: <strong>542542</strong> (I&M Bank) <br/>
                     Account: <strong>29930</strong> (Tujiimarishe SHG)
                   </div>
                )}
              </div>

              {/* Amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                    Table Banking (KES)
                  </label>
                  <input
                    type="number"
                    value={newContribution.table_banking}
                    onChange={(e) => setNewContribution({ ...newContribution, table_banking: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 217, 192, 0.3)',
                      background: 'rgba(15, 15, 20, 0.8)',
                      color: '#00D9C0',
                      fontWeight: '700',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#ADB5BD', marginBottom: '8px' }}>
                    Bank Savings (KES)
                  </label>
                  <input
                    type="number"
                    value={newContribution.bank_savings}
                    onChange={(e) => setNewContribution({ ...newContribution, bank_savings: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      background: 'rgba(15, 15, 20, 0.8)',
                      color: '#A855F7',
                      fontWeight: '700',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
              }}>
                <span style={{ color: '#ADB5BD' }}>Total:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#F8F9FA' }}>
                  KES {((parseFloat(newContribution.table_banking) || 0) + (parseFloat(newContribution.bank_savings) || 0)).toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #00D9C0 0%, #0A84FF 100%)',
                  borderRadius: '12px',
                  border: 'none',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginTop: '16px',
                  boxShadow: '0 8px 24px rgba(0, 217, 192, 0.3)',
                }}
              >
                {loading ? 'Processing...' : 'Record Payment'}
              </button>
            </form>
          </div>
        )}

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
      {/* Member Details Modal */}
      {showMemberModal && selectedMember && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 100,
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#141419',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F8F9FA' }}>{selectedMember.full_name}</h2>
                <p style={{ color: '#ADB5BD', fontSize: '0.875rem' }}>{selectedMember.email}</p>
              </div>
              <button
                onClick={() => setShowMemberModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {/* Summary Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}>
                <div style={{ background: 'rgba(10, 132, 255, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(10, 132, 255, 0.2)' }}>
                   <p style={{ color: '#0A84FF', fontSize: '0.875rem', fontWeight: '600' }}>Table Banking (Pool)</p>
                   <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>KES {memberStats.totalTableBanking.toLocaleString()}</p>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                   <p style={{ color: '#A855F7', fontSize: '0.875rem', fontWeight: '600' }}>Bank Savings (MMF)</p>
                   <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>KES {memberStats.totalSavings.toLocaleString()}</p>
                </div>
                <div style={{ background: 'rgba(255, 69, 58, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 69, 58, 0.2)' }}>
                   <p style={{ color: '#FF453A', fontSize: '0.875rem', fontWeight: '600' }}>Active Loan Balance</p>
                   <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FF453A' }}>KES {memberStats.loanBalance.toLocaleString()}</p>
                </div>
              </div>

              {/* Loan History */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Loan History
              </h3>
              {memberStats.loans.length === 0 ? (
                <p style={{ color: '#ADB5BD', marginBottom: '32px' }}>No loans found.</p>
              ) : (
                <div style={{ overflowX: 'auto', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ADB5BD' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ADB5BD' }}>Amount + Int.</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ADB5BD' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: '#ADB5BD' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberStats.loans.map(loan => (
                        <tr key={loan.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px', color: '#F8F9FA' }}>{new Date(loan.request_date).toLocaleDateString()}</td>
                          <td style={{ padding: '12px', color: '#F8F9FA' }}>KES {parseFloat(loan.total_amount).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>
                             <span style={{ 
                                background: loan.status === 'active' ? 'rgba(50, 215, 75, 0.2)' : loan.status === 'completed' ? 'rgba(10, 132, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                color: loan.status === 'active' ? '#32D74B' : loan.status === 'completed' ? '#0A84FF' : '#ADB5BD',
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'capitalize'
                             }}>
                                {loan.status}
                             </span>
                          </td>
                          <td style={{ padding: '12px', color: '#F8F9FA', textAlign: 'right' }}>KES {parseFloat(loan.balance).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contribution History */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F8F9FA', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Contribution History
              </h3>
               {memberStats.contributions.length === 0 ? (
                <p style={{ color: '#ADB5BD' }}>No contributions found.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ADB5BD' }}>Month</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ADB5BD' }}>Table Banking</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ADB5BD' }}>Savings</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: '#ADB5BD' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberStats.contributions.map(c => (
                        <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px', color: '#F8F9FA' }}>{c.month} {c.year}</td>
                          <td style={{ padding: '12px', color: '#0A84FF' }}>KES {parseFloat(c.table_banking_amount).toLocaleString()}</td>
                          <td style={{ padding: '12px', color: '#A855F7' }}>KES {parseFloat(c.bank_savings_amount).toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                             <span style={{ 
                                color: c.status === 'confirmed' ? '#32D74B' : '#FF9F0A',
                                fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize'
                             }}>
                                {c.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
