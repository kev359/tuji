'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function MemberReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Reports State
  const [reportType, setReportType] = useState('monthly');
  const [reportData, setReportData] = useState([]);
  const [reportMonth, setReportMonth] = useState('');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    setLoading(false);
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

  if (loading && !profile) {
    return <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#F8F9FA' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px 40px' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(135deg, #FFF 0%, #ADB5BD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
             Financial Reports
          </h1>
          <p style={{ color: '#ADB5BD', fontSize: '1.1rem' }}>Transparent access to group performance and records.</p>
        </div>

        <div style={{ background: 'rgba(30, 30, 35, 0.6)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '32px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333' }}>
                      <option value="monthly">Monthly Contributions & Activity</option>
                      <option value="loans">Loan Risk & Defaults</option>
                      <option value="summary">Member Financial Summary</option>
                  </select>

                  {reportType === 'monthly' && (
                     <>
                        <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333' }}>
                           <option value="">Select Month</option>
                           {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={reportYear} onChange={e => setReportYear(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #333' }}>
                           <option value="2025">2025</option>
                           <option value="2026">2026</option>
                        </select>
                     </>
                  )}

                  <button onClick={generateReport} disabled={loading} style={{ padding: '12px 24px', background: '#6366F1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? 'Generating...' : 'View Report'}
                  </button>
                  {reportData.length > 0 && (
                      <button onClick={downloadPDF} style={{ padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginLeft: 'auto' }}>
                          ⬇️ PDF Download
                      </button>
                  )}
            </div>

            {reportData.length > 0 ? (
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <tr style={{ textAlign: 'left', color: '#ADB5BD' }}>
                                  {reportType === 'monthly' && (
                                     <>
                                        <th style={{ padding: '16px' }}>Member</th>
                                        <th style={{ padding: '16px' }}>Table Banking</th>
                                        <th style={{ padding: '16px' }}>Savings</th>
                                        <th style={{ padding: '16px' }}>Total Contrib</th>
                                        <th style={{ padding: '16px' }}>Loans Taken</th>
                                        <th style={{ padding: '16px' }}>Repayments</th>
                                        <th style={{ padding: '16px' }}>Net Flow</th>
                                     </>
                                  )}
                                  {reportType === 'loans' && (
                                     <>
                                        <th style={{ padding: '16px' }}>Member</th>
                                        <th style={{ padding: '16px' }}>Borrowed</th>
                                        <th style={{ padding: '16px' }}>Repayable</th>
                                        <th style={{ padding: '16px' }}>Paid</th>
                                        <th style={{ padding: '16px' }}>Balance</th>
                                        <th style={{ padding: '16px' }}>Status</th>
                                        <th style={{ padding: '16px' }}>Date</th>
                                     </>
                                  )}
                                  {reportType === 'summary' && (
                                     <>
                                        <th style={{ padding: '16px' }}>Member</th>
                                        <th style={{ padding: '16px' }}>Total Shares</th>
                                        <th style={{ padding: '16px' }}>Total Savings</th>
                                        <th style={{ padding: '16px' }}>Active Debt</th>
                                        <th style={{ padding: '16px' }}>Net Standing</th>
                                     </>
                                  )}
                              </tr>
                          </thead>
                          <tbody>
                              {reportData.map((row, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                      <td style={{ padding: '16px', color: '#F8F9FA', fontWeight: '500' }}>{row.member_name}</td>
                                      
                                      {reportType === 'monthly' && (
                                         <>
                                            <td style={{ padding: '16px', color: '#32D74B' }}>{parseFloat(row.table_banking||0).toLocaleString()}</td>
                                            <td style={{ padding: '16px', color: '#A855F7' }}>{parseFloat(row.bank_savings||0).toLocaleString()}</td>
                                            <td style={{ padding: '16px', fontWeight: '700', color: '#F8F9FA' }}>{parseFloat(row.total_contributions||0).toLocaleString()}</td>
                                            <td style={{ padding: '16px', color: '#EF4444' }}>{parseFloat(row.loans_taken||0).toLocaleString()}</td>
                                            <td style={{ padding: '16px', color: '#10B981' }}>{parseFloat(row.total_repaid||0).toLocaleString()}</td>
                                            <td style={{ padding: '16px', fontWeight: '700' }}>{parseFloat(row.net_activity||0).toLocaleString()}</td>
                                         </>
                                      )}

                                      {reportType === 'loans' && (
                                         <>
                                            <td style={{ padding: '16px' }}>{parseFloat(row.amount_borrowed).toLocaleString()}</td>
                                            <td style={{ padding: '16px' }}>{parseFloat(row.total_repayable).toLocaleString()}</td>
                                            <td style={{ padding: '16px', color: '#32D74B' }}>{parseFloat(row.amount_paid).toLocaleString()}</td>
                                            <td style={{ padding: '16px', color: '#EF4444', fontWeight: '700' }}>{parseFloat(row.balance).toLocaleString()}</td>
                                            <td style={{ padding: '16px', textTransform: 'uppercase' }}>{row.status}</td>
                                            <td style={{ padding: '16px' }}>{new Date(row.loan_date).toLocaleDateString()}</td>
                                         </>
                                      )}

                                      {reportType === 'summary' && (
                                         <>
                                            <td style={{ padding: '16px', color: '#32D74B' }}>{parseFloat(row.total_shares).toLocaleString()}</td>
                                            <td style={{ padding: '16px', color: '#A855F7' }}>{parseFloat(row.total_savings).toLocaleString()}</td>
                                            <td style={{ padding: '16px', color: '#EF4444' }}>{parseFloat(row.active_loan_balance).toLocaleString()}</td>
                                            <td style={{ padding: '16px', fontWeight: '700', color: '#F8F9FA' }}>
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
                  <div style={{ padding: '64px', textAlign: 'center', color: '#ADB5BD', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      <p>Select report criteria above to generate a view.</p>
                  </div>
              )}

        </div>
      </div>
    </div>
  );
}
