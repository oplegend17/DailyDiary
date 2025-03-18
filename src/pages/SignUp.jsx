import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showManualLogin, setShowManualLogin] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(email, password);
      
      if (error) throw error;
      
      // Check if confirmationSentAt is present to verify email was sent
      if (data?.user?.confirmation_sent_at) {
        setMessage('Registration successful! Please check your email for verification.');
        setShowManualLogin(true);
      } else {
        // If no confirmation was sent, we're likely in development or email verification is disabled
        setMessage('Account created successfully!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Your email has not been confirmed yet. Please check your inbox for the verification email.');
          
          // Option to resend verification email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email
          });
          
          if (resendError) {
            throw resendError;
          } else {
            setMessage('A new verification email has been sent to your inbox.');
          }
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create a DailyNotes Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        {!showManualLogin ? (
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
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        ) : (
          <div className="manual-login-section">
            <p className="info-text">Didn't receive the verification email? You can try to log in anyway, or request a new verification email.</p>
            
            <div className="action-buttons">
              <button 
                onClick={handleManualLogin} 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Try to Log In'}
              </button>
            </div>
            
            <div className="auth-footer" style={{ marginTop: '15px' }}>
              <Link to="/login">Return to Login Page</Link>
            </div>
          </div>
        )}
        
        {!showManualLogin && (
          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
} 