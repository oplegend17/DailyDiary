import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    defaultMood: 'neutral'
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  async function fetchSettings() {
    if (!user) return;
    
    try {
      console.log('Fetching settings for user:', user.id);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        throw error;
      }
      
      if (data) {
        console.log('Settings loaded:', data.settings);
        setSettings(data.settings);
      } else {
        console.log('No settings found, using defaults');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    
    try {
      console.log('Saving settings:', settings);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
      
      setMessage('Settings saved successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  
  function handleToggle(setting) {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container p-4 max-w-2xl mx-auto">
      <div className="settings-header mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-2">Customize your DailyNotes experience</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
          <p>{message}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Appearance</h2>
            
            <div className="form-group mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Dark Mode</label>
                  <p className="text-sm text-gray-500">Switch to dark theme</p>
                </div>
                <div className="toggle-switch">
                  <button 
                    type="button"
                    onClick={() => handleToggle('darkMode')}
                    className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors focus:outline-none ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'}`}></span>
                  </button>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-medium text-gray-800 mb-4 mt-8">Notifications</h2>
            
            <div className="form-group mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive email updates and reminders</p>
                </div>
                <div className="toggle-switch">
                  <button 
                    type="button"
                    onClick={() => handleToggle('emailNotifications')}
                    className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors focus:outline-none ${settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'}`}></span>
                  </button>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-medium text-gray-800 mb-4 mt-8">Note Settings</h2>
            
            <div className="form-group mb-4">
              <label htmlFor="defaultMood" className="block font-medium text-gray-700 mb-2">Default Mood</label>
              <select
                id="defaultMood"
                value={settings.defaultMood}
                onChange={(e) => setSettings({ ...settings, defaultMood: e.target.value })}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="happy">Happy</option>
                <option value="neutral">Neutral</option>
                <option value="sad">Sad</option>
                <option value="angry">Angry</option>
                <option value="excited">Excited</option>
                <option value="tired">Tired</option>
                <option value="anxious">Anxious</option>
                <option value="peaceful">Peaceful</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 flex items-center"
              disabled={saving}
            >
              {saving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings; 