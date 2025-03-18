import { useState } from 'react';

function SupabaseConnectionError() {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="supabase-error-container">
      <div className="supabase-error-card">
        <h2>Connection Error</h2>
        <p>
          Could not connect to Supabase. This typically happens when your Supabase configuration
          is not set up correctly.
        </p>
        
        <button 
          className="toggle-instructions-btn"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? 'Hide Instructions' : 'Show Setup Instructions'}
        </button>
        
        {showInstructions && (
          <div className="setup-instructions">
            <h3>Setup Instructions:</h3>
            <ol>
              <li>
                <strong>Create a Supabase account</strong>
                <p>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> and create an account.</p>
              </li>
              <li>
                <strong>Create a new project</strong>
                <p>Create a new Supabase project with a name of your choice.</p>
              </li>
              <li>
                <strong>Get your project URL and anon key</strong>
                <p>From your project dashboard, go to Project Settings → API to find these values.</p>
              </li>
              <li>
                <strong>Update .env file</strong>
                <p>Create or update the .env file in your project root with:</p>
                <pre>
                  VITE_SUPABASE_URL=your_project_url
                  VITE_SUPABASE_ANON_KEY=your_anon_key
                </pre>
              </li>
              <li>
                <strong>Restart your development server</strong>
                <p>Stop and restart your dev server with npm run dev</p>
              </li>
              <li>
                <strong>Set up database tables</strong>
                <p>In the Supabase dashboard, create the following tables:</p>
                <ul>
                  <li><strong>notes</strong>: id, title, content, mood, tags, user_id, created_at, updated_at</li>
                  <li><strong>user_settings</strong>: id, user_id, settings (JSONB), created_at, updated_at</li>
                </ul>
              </li>
              <li>
                <strong>Enable authentication</strong>
                <p>In the Supabase dashboard, go to Authentication and configure your desired auth providers.</p>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupabaseConnectionError; 