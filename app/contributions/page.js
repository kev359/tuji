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

      // Refresh contributions
      await fetchContributions(user.id);
      
      // Reset form
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
          <p className="mt-4 text-gray-600">Loading contributions...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">My Contributions</h1>
            <p className="text-gray-600 mt-2">Track your monthly contributions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Record Contribution
          </button>
        </div>

        {/* Contributions Table */}
        <div className="card overflow-hidden">
          {contributions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contributions yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by recording your first contribution.</p>
              <div className="mt-6">
                <button onClick={() => setShowModal(true)} className="btn-primary">
                  Record First Contribution
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table Banking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Savings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmed By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contributions.map((contribution) => {
                    const total = parseFloat(contribution.table_banking_amount || 0) + 
                                parseFloat(contribution.bank_savings_amount || 0);
                    
                    return (
                      <tr key={contribution.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contribution.month} {contribution.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(contribution.table_banking_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {parseFloat(contribution.bank_savings_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          KES {total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${
                            contribution.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'
                          }`}>
                            {contribution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm font-medium text-green-700 mb-1">Total Contributed</p>
            <p className="text-2xl font-bold text-green-900">
              KES {contributions.reduce((sum, c) => 
                sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0), 
                0
              ).toLocaleString()}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm font-medium text-blue-700 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-blue-900">
              KES {contributions.filter(c => c.status === 'confirmed').reduce((sum, c) => 
                sum + parseFloat(c.table_banking_amount || 0) + parseFloat(c.bank_savings_amount || 0), 
                0
              ).toLocaleString()}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
            <p className="text-sm font-medium text-yellow-700 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Record Contribution</h2>
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
                  Month
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="input-field"
                  required
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Banking Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.tableBankingAmount}
                  onChange={(e) => setFormData({ ...formData, tableBankingAmount: e.target.value })}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Savings Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.bankSavingsAmount}
                  onChange={(e) => setFormData({ ...formData, bankSavingsAmount: e.target.value })}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Amount:</p>
                <p className="text-2xl font-bold text-[#2E7D32]">
                  KES {(parseFloat(formData.tableBankingAmount || 0) + 
                       parseFloat(formData.bankSavingsAmount || 0)).toLocaleString()}
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
