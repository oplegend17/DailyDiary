import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const moodOptions = [
    { label: 'Happy', emoji: '😊' },
    { label: 'Sad', emoji: '😔' },
    { label: 'Anxious', emoji: '😰' },
    { label: 'Excited', emoji: '🤩' },
    { label: 'Calm', emoji: '😌' },
    { label: 'Frustrated', emoji: '😤' },
    { label: 'Grateful', emoji: '🙏' },
  ];
  
  useEffect(() => {
    async function fetchNote() {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError('Note not found');
          return;
        }
        
        setTitle(data.title);
        setContent(data.content);
        setMood(data.mood || '');
        setTags(data.tags ? data.tags.join(', ') : '');
      } catch (err) {
        console.error('Failed to fetch note for editing:', err);
        setError('Failed to load note. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNote();
  }, [id, user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      // Process tags
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      const result = await supabase
        .from('notes')
        .update({
          title,
          content,
          mood: mood || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (result.error) {
        throw result.error;
      }
      
      navigate(`/notes/${id}`);
    } catch (error) {
      console.error('Failed to update note:', error);
      setError('Failed to update note. Please try again. ' + (error.message || ''));
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="loading-text">Loading note...</p>
      </div>
    );
  }
  
  if (error && !title && !content) {
    return (
      <div className="empty-state">
        <p className="empty-state-text">{error}</p>
        <button 
          onClick={() => navigate('/notes')}
          className="btn btn-primary"
        >
          Back to Notes
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ffe0ef 0%, #fff0f5 100%)', padding: '32px 0' }}>
      <div className="note-form-page" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', fontSize: 32, fontWeight: 700, color: '#2b2d42', marginBottom: 8 }}>
            <span style={{ fontSize: 36, marginRight: 12 }}>💖</span> Edit Note
          </h1>
          <div style={{ height: 4, width: 80, background: 'var(--primary)', borderRadius: 2, marginBottom: 24 }}></div>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div className="note-form-container card" style={{ background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 8px 32px rgba(255,105,180,0.10)', padding: 40, marginTop: 0 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title" className="form-label" style={{ fontSize: 18 }}>Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="form-input"
                required
                autoFocus
                style={{ fontSize: 18, marginBottom: 8 }}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content" className="form-label" style={{ fontSize: 18 }}>Content</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts here..."
                rows={8}
                className="form-input form-textarea"
                required
                style={{ fontSize: 16, marginBottom: 8 }}
              ></textarea>
            </div>
            
            <div className="form-row" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div className="form-group mood-select-container" style={{ flex: 1, minWidth: 180 }}>
                <label htmlFor="mood" className="form-label">Mood (Optional)</label>
                <select
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="form-input form-select"
                  style={{ fontSize: 16 }}
                >
                  <option value="">Select mood</option>
                  {moodOptions.map(option => (
                    <option key={option.label} value={option.label}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group tags-input-container" style={{ flex: 2, minWidth: 220 }}>
                <label htmlFor="tags" className="form-label">Tags (Optional, comma-separated)</label>
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="work, personal, ideas, etc."
                  className="form-input"
                  style={{ fontSize: 16 }}
                />
              </div>
            </div>
            
            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32 }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ minWidth: 120, fontSize: 16, borderColor: 'var(--primary)', color: 'var(--primary)', background: 'white' }}
                onClick={() => navigate(`/notes/${id}`)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: 160, fontSize: 18, background: 'var(--primary)', boxShadow: '0 4px 16px rgba(255,105,180,0.15)' }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 