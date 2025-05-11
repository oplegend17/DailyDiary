import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    defaultMood: 'neutral'
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching settings:', fetchError);
        // If settings don't exist, we'll create them with defaults
        if (fetchError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert([
              {
                user_id: user.id,
                settings: {
                  emailNotifications: true,
                  defaultMood: 'neutral'
                }
              }
            ]);

          if (insertError) {
            throw insertError;
          }
        } else {
          throw fetchError;
        }
      } else if (data) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: settings
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        throw upsertError;
      }

      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <div className="loading-spinner">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Customize your DailyNotes experience</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success" role="alert">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="settings-section">
            <h2 className="section-title">
              <span className="section-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </span>
              Notifications
            </h2>
            <div className="settings-option">
              <div className="option-label">
                <span>Email Notifications</span>
                <span className="option-description">Receive email updates and reminders</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">
              <span className="section-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </span>
              Note Settings
            </h2>
            <div className="settings-option" style={{ background: 'rgba(255,182,193,0.15)', borderRadius: '12px', border: '1.5px solid #ffb6c1', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 8px rgba(255,182,193,0.10)' }}>
              <div className="option-label" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontWeight: 600, color: '#2b2d42', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span role="img" aria-label="mood" style={{ fontSize: 22, marginRight: 6 }}>😊</span> Default Mood
                </span>
                <span className="option-description" style={{ fontSize: 14, color: '#6c757d', marginTop: 4 }}>Set the default mood for new notes</span>
              </div>
              <select
                className="form-input form-input-settings form-select"
                style={{ minWidth: 140, fontSize: 16, border: '1.5px solid #ffb6c1', background: 'white', borderRadius: 8, padding: '8px 16px' }}
                value={settings.defaultMood}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultMood: e.target.value }))}
              >
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="excited">Excited</option>
                <option value="tired">Tired</option>
              </select>
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 