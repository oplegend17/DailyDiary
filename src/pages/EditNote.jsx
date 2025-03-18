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
  
  const moodOptions = ['Happy', 'Sad', 'Anxious', 'Excited', 'Calm', 'Frustrated', 'Grateful'];
  
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
    <div className="note-form-page">
      <div className="page-header">
        <h1 className="page-title">Edit Note</h1>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="note-form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content" className="form-label">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              rows="10"
              className="form-control"
              required
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="mood" className="form-label">Mood (Optional)</label>
            <select
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="form-control"
            >
              <option value="">Select mood</option>
              {moodOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tags" className="form-label">Tags (Optional, comma-separated)</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, personal, ideas, etc."
              className="form-control"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => navigate(`/notes/${id}`)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 