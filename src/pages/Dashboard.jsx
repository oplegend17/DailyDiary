import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Get total count of user's notes
      const { count: totalNotes, error: countError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      // Get recent notes (last 5)
      const { data: recentNotes, error: recentError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Get count of notes created in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentlyCreated, error: recentlyCreatedError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentlyCreatedError) throw recentlyCreatedError;

      // Get tags count
      const { data: tags, error: tagsError } = await supabase
        .from('notes')
        .select('tags')
        .eq('user_id', user.id);

      if (tagsError) throw tagsError;
      
      // Count unique tags
      const uniqueTags = new Set();
      tags.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
          note.tags.forEach(tag => uniqueTags.add(tag));
        }
      });

      setDashboardData({
        totalNotes,
        recentNotes,
        recentlyCreated,
        uniqueTagsCount: uniqueTags.size
      });
    } catch (error) {
      setError('Error fetching dashboard data: ' + error.message);
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Dashboard</h1>
      
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="stat-title">Total Notes</h3>
              <p className="stat-value">{dashboardData.totalNotes}</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-title">Created Last 7 Days</h3>
              <p className="stat-value">{dashboardData.recentlyCreated}</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-title">Unique Tags</h3>
              <p className="stat-value">{dashboardData.uniqueTagsCount}</p>
            </div>
          </div>

          <div className="recent-notes-section">
            <h2 className="section-title">Recent Notes</h2>
            {dashboardData.recentNotes.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">You haven't created any notes yet.</p>
                <Link to="/notes/new" className="btn btn-primary">Create Your First Note</Link>
              </div>
            ) : (
              <div className="recent-notes-list">
                {dashboardData.recentNotes.map(note => (
                  <Link to={`/notes/${note.id}`} key={note.id} className="recent-note-card">
                    <h3 className="recent-note-title">{note.title}</h3>
                    <p className="recent-note-excerpt">
                      {note.content.length > 100 
                        ? note.content.substring(0, 100) + '...' 
                        : note.content}
                    </p>
                    <div className="recent-note-meta">
                      <span className="recent-note-date">{formatDate(note.created_at)}</span>
                      {note.tags && note.tags.length > 0 && (
                        <div className="recent-note-tags">
                          {note.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="note-tag">{tag}</span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="more-tags">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard; 