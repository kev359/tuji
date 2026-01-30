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
        options: { data: { full_name: fullName } }
      });

      if (error) throw error;

      if (data.user) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName, phone_number: phoneNumber })
          .eq('id', data.user.id);

        setSuccess('Account created! Please sign in.');
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

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #E5E7EB',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}>
        {/* Logo Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '40px 30px 30px',
          textAlign: 'center',
        }}>
          <img 
            src="/tujlogo.webp" 
            alt="Tujiimarishe SHG" 
            style={{
              height: '100px',
              width: 'auto',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            }}
          />
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#FFFFFF',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
          }}>
            Tujiimarishe SHG
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)',
            margin: 0,
          }}>
            Self Help Group Management Platform
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          padding: '20px 30px 0',
          gap: '10px',
        }}>
          <button
            onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: '15px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              background: !isSignUp 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#F3F4F6',
              color: !isSignUp ? '#FFFFFF' : '#6B7280',
              boxShadow: !isSignUp ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
            }}
          >
            Sign In
          </button>
          {/* <button
            onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: '15px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              background: isSignUp 
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' 
                : '#F3F4F6',
              color: isSignUp ? '#FFFFFF' : '#6B7280',
              boxShadow: isSignUp ? '0 4px 15px rgba(17, 153, 142, 0.4)' : 'none',
            }}
          >
            Sign Up
          </button> */}
        </div>

        {/* Form Section */}
        <div style={{ padding: '25px 30px 30px' }}>
          {/* Error Message */}
          {error && (
            <div style={{
              padding: '14px 16px',
              marginBottom: '20px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              color: '#DC2626',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              padding: '14px 16px',
              marginBottom: '20px',
              backgroundColor: '#D1FAE5',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              color: '#059669',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              ✓ {success}
            </div>
          )}

          {/* Sign In Form */}
          {!isSignUp && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading 
                    ? '#9CA3AF' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s',
                  transform: 'translateY(0)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                {loading ? '⏳ Signing in...' : '🚀 Sign In'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {isSignUp && (
            <form onSubmit={handleSignUp}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254XXXXXXXXX"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength="6"
                  required
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>
                  Minimum 6 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading 
                    ? '#9CA3AF' 
                    : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(17, 153, 142, 0.4)',
                  transition: 'all 0.3s',
                }}
              >
                {loading ? '⏳ Creating...' : '✨ Create Account'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 30px',
          backgroundColor: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '13px',
            color: '#9CA3AF',
            margin: 0,
          }}>
            🔒 Secure platform powered by STEM ED
          </p>
        </div>
      </div>
    </div>
  );
}
