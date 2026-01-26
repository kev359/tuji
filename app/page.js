'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('profile', JSON.stringify(profile));

        router.push('/dashboard');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone_number: phoneNumber,
          })
          .eq('id', data.user.id);

        if (profileError) throw profileError;

        setSuccess('Account created successfully! Please sign in.');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setFullName('');
        setPhoneNumber('');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 25%, #DBEAFE 50%, #E9D5FF 75%, #FCE7F3 100%)'
      }}
    >
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: '500px',
            height: '500px',
            background: 'linear-gradient(135deg, #F59E0B, #EC4899)',
            top: '-100px',
            right: '-100px',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: '400px',
            height: '400px',
            background: 'linear-gradient(135deg, #14B8A6, #3B82F6)',
            bottom: '-100px',
            left: '-100px',
            animation: 'float 15s ease-in-out infinite reverse'
          }}
        />
      </div>

      {/* Login Card */}
      <div 
        className="relative w-full max-w-md"
        style={{
          animation: 'slideUp 0.6s ease-out'
        }}
      >
        {/* Glass Card */}
        <div 
          className="backdrop-blur-xl rounded-3xl shadow-2xl border overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Logo Section */}
          <div className="text-center pt-8 pb-6 px-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src="/tujlogo.webp" 
                  alt="Tujiimarishe SHG Logo" 
                  className="h-28 w-auto object-contain"
                  style={{
                    filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))',
                    animation: 'pulse 3s ease-in-out infinite'
                  }}
                />
              </div>
            </div>
            
            <h1 
              className="text-4xl font-extrabold mb-2"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #9333EA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}
            >
              Tujiimarishe SHG
            </h1>
            <p className="text-gray-600 font-medium text-sm">
              Self Help Group Management Platform
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="px-6 pb-6">
            <div 
              className="relative flex p-1 rounded-xl"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setSuccess('');
                }}
                className="relative flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300"
                style={{
                  background: !isSignUp 
                    ? 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)' 
                    : 'transparent',
                  color: !isSignUp ? 'white' : '#6B7280',
                  boxShadow: !isSignUp ? '0 10px 25px -5px rgba(245, 158, 11, 0.4)' : 'none',
                  transform: !isSignUp ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  setSuccess('');
                }}
                className="relative flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300"
                style={{
                  background: isSignUp 
                    ? 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)' 
                    : 'transparent',
                  color: isSignUp ? 'white' : '#6B7280',
                  boxShadow: isSignUp ? '0 10px 25px -5px rgba(20, 184, 166, 0.4)' : 'none',
                  transform: isSignUp ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div 
              className="mx-6 mb-4 px-4 py-3 rounded-xl border"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#DC2626',
                animation: 'shake 0.5s ease-in-out'
              }}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div 
              className="mx-6 mb-4 px-4 py-3 rounded-xl border"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#059669',
                animation: 'slideDown 0.5s ease-out'
              }}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          {!isSignUp && (
            <form onSubmit={handleLogin} className="px-6 pb-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid rgba(229, 231, 235, 0.8)',
                    borderRadius: '0.75rem',
                    fontSize: '0.9375rem',
                    transition: 'all 0.3s',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F59E0B';
                    e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(229, 231, 235, 0.8)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid rgba(229, 231, 235, 0.8)',
                    borderRadius: '0.75rem',
                    fontSize: '0.9375rem',
                    transition: 'all 0.3s',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F59E0B';
                    e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(229, 231, 235, 0.8)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-4 rounded-xl transition-all duration-300 mt-6"
                style={{
                  background: loading 
                    ? '#9CA3AF' 
                    : 'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #9333EA 100%)',
                  color: 'white',
                  boxShadow: loading ? 'none' : '0 10px 30px -5px rgba(245, 158, 11, 0.5)',
                  transform: loading ? 'scale(1)' : 'scale(1)',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 15px 35px -5px rgba(245, 158, 11, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 10px 30px -5px rgba(245, 158, 11, 0.5)';
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {isSignUp && (
            <form onSubmit={handleSignUp} className="px-6 pb-8 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="input-field"
                  style={{width: '100%', padding: '0.875rem 1rem', border: '2px solid rgba(229, 231, 235, 0.8)', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)'}}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="input-field"
                  style={{width: '100%', padding: '0.875rem 1rem', border: '2px solid rgba(229, 231, 235, 0.8)', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)'}}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254XXXXXXXXX"
                  required
                  className="input-field"
                  style={{width: '100%', padding: '0.875rem 1rem', border: '2px solid rgba(229, 231, 235, 0.8)', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)'}}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength="6"
                  required
                  className="input-field"
                  style={{width: '100%', padding: '0.875rem 1rem', border: '2px solid rgba(229, 231, 235, 0.8)', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)'}}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-4 rounded-xl transition-all duration-300 mt-4"
                style={{
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)',
                  color: 'white',
                  boxShadow: loading ? 'none' : '0 10px 30px -5px rgba(20, 184, 166, 0.5)',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Footer */}
          <div 
            className="px-6 pb-6 text-center"
            style={{
              borderTop: '1px solid rgba(229, 231, 235, 0.5)',
              paddingTop: '1.5rem'
            }}
          >
            <p className="text-xs text-gray-500">
              Secure platform powered by Supabase
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
