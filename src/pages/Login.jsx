import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [isUnconfirmedEmail, setIsUnconfirmedEmail] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    setIsUnconfirmedEmail(false);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setIsUnconfirmedEmail(true);
          setError('Your email has not been confirmed yet. Please check your inbox or request a new verification email.');
        } else {
          throw error;
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setResendingEmail(true);
    setMessage('');
    setError('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      
      if (error) throw error;
      
      setMessage('Verification email has been resent. Please check your inbox.');
    } catch (error) {
      setError('Failed to resend verification email: ' + error.message);
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign In to DailyNotes</h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        {isUnconfirmedEmail && (
          <div className="verification-options">
            <p>Didn't receive the verification email?</p>
            <button
              onClick={resendVerificationEmail}
              className="resend-button"
              disabled={resendingEmail}
            >
              {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}
        
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
} 