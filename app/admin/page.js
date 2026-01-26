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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const pendingCount = pendingContributions.length + pendingLoans.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Treasurer Admin Panel</h1>
              <p className="text-gray-600 mt-2">Manage contributions, loans, and payments</p>
            </div>
            <div className="bg-gradient-to-r from-[#FFD700] to-[#FFA000] text-gray-900 px-6 py-3 rounded-lg font-bold shadow-lg">
              <div className="text-center">
                <p className="text-sm">Pending Actions</p>
                <p className="text-3xl">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('contributions')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'contributions'
                  ? 'text-[#2E7D32] border-b-2 border-[#2E7D32]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Contributions ({pendingContributions.length})
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'loans'
                  ? 'text-[#2E7D32] border-b-2 border-[#2E7D32]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Loans ({pendingLoans.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'payments'
                  ? 'text-[#2E7D32] border-b-2 border-[#2E7D32]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Record Payment ({activeLoans.length})
            </button>
          </div>
        </div>

        {/* Pending Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="card overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Contributions</h2>
            {pendingContributions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No pending contributions
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table Banking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Savings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingContributions.map((contrib) => (
                      <tr key={contrib.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contrib.member?.full_name || contrib.member?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contrib.month} {contrib.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(contrib.table_banking_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(contrib.bank_savings_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(contrib.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => confirmContribution(contrib.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
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
          <div className="card overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Loan Requests</h2>
            {pendingLoans.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No pending loan requests
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.member?.full_name || loan.member?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(loan.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(loan.interest_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          KES {parseFloat(loan.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={loan.purpose}>
                          {loan.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(loan.request_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => approveLoan(loan.id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectLoan(loan.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition-all"
                          >
                            Reject
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

        {/* Record Payment Tab */}
        {activeTab === 'payments' && (
          <div className="card overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Loans - Record Payment</h2>
            {activeLoans.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No active loans
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Due</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.member?.full_name || loan.member?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(loan.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(loan.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(loan.amount_paid || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          KES {parseFloat(loan.balance || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openPaymentModal(loan)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                          >
                            Record Payment
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Record Loan Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Member:</strong> {selectedLoan.member?.full_name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Outstanding Balance:</strong> 
                <span className="text-red-600 font-bold ml-2">
                  KES {parseFloat(selectedLoan.balance || 0).toLocaleString()}
                </span>
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (KES)
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="input-field"
                  placeholder="Enter payment amount"
                  min="0.01"
                  max={selectedLoan.balance}
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: KES {parseFloat(selectedLoan.balance || 0).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="input-field"
                  placeholder="Add any notes about this payment..."
                  rows="3"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50"
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
