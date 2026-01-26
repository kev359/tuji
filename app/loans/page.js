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

      // Refresh loans
      await fetchLoans(user.id);
      
      // Reset form
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
      pending: 'badge-pending',
      approved: 'badge-active',
      active: 'badge-active',
      completed: 'badge-completed',
      rejected: 'badge-rejected',
    };
    return colors[status] || 'badge';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
          <p className="mt-4 text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Loans</h1>
            <p className="text-gray-600 mt-2">Track your loan requests and repayments</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Request Loan
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Loan Information</p>
              <p className="text-sm text-blue-700 mt-1">
                All loans carry a 10% interest rate. Repayment is tracked by the treasurer.
              </p>
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="card overflow-hidden">
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No loans yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by requesting your first loan.</p>
              <div className="mt-6">
                <button onClick={() => setShowModal(true)} className="btn-primary">
                  Request First Loan
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest (10%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(loan.request_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        KES {parseFloat(loan.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        KES {parseFloat(loan.interest_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        KES {parseFloat(loan.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.status === 'active' ? (
                          <span className="font-semibold text-red-600">
                            KES {parseFloat(loan.balance || 0).toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm font-medium text-blue-700 mb-1">Total Borrowed</p>
            <p className="text-2xl font-bold text-blue-900">
              KES {loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm font-medium text-green-700 mb-1">Active Loans</p>
            <p className="text-2xl font-bold text-green-900">
              {loans.filter(l => l.status === 'active' || l.status === 'approved').length}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <p className="text-sm font-medium text-red-700 mb-1">Outstanding Balance</p>
            <p className="text-2xl font-bold text-red-900">
              KES {loans.filter(l => l.status === 'active').reduce((sum, l) => 
                sum + parseFloat(l.balance || 0), 0
              ).toLocaleString()}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-1">Completed Loans</p>
            <p className="text-2xl font-bold text-gray-900">
              {loans.filter(l => l.status === 'completed').length}
            </p>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Request Loan</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-field"
                  placeholder="Enter amount"
                  min="100"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum: KES 100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="input-field"
                  placeholder="Describe the purpose of this loan..."
                  rows="3"
                  minLength="5"
                  required
                ></textarea>
              </div>

              {formData.amount && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Loan Amount:</span>
                    <span className="font-semibold">KES {parseFloat(formData.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Interest (10%):</span>
                    <span className="font-semibold">KES {calculateInterest().toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-medium text-gray-900">Total Repayment:</span>
                    <span className="text-xl font-bold text-[#2E7D32]">
                      KES {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> All loans carry a 10% interest rate. Your request will be reviewed by the treasurer.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50"
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
