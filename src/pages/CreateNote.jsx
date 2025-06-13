import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function CreateNote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const LOCAL_STORAGE_KEY = `unsaved_note_${user?.id || 'anonymous'}`;

  // Load from local storage on mount
  useEffect(() => {
    const savedNote = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedNote) {
      const { title: savedTitle, content: savedContent } = JSON.parse(savedNote);
      setTitle(savedTitle);
      setContent(savedContent);
      setError('Unsaved changes loaded from previous session.');
    }
  }, [user]);

  // Debounced auto-save to local storage
  useEffect(() => {
    setIsAutoSaving(true);
    const handler = setTimeout(() => {
      if (title.trim() || content.trim()) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ title, content }));
        console.log('Auto-saved to local storage');
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      setIsAutoSaving(false);
    }, 1000); // Save after 1 second of inactivity

    return () => {
      clearTimeout(handler);
    };
  }, [title, content, user]);

  const moodOptions = ['Happy', 'Sad', 'Anxious', 'Excited', 'Calm', 'Frustrated', 'Grateful'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Creating note with:', { title, content, mood, tags, userId: user.id });
      
      // Process tags
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      const result = await supabase.from('notes').insert({
        title,
        content,
        mood: mood || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        user_id: user.id
      });
      
      if (result.error) {
        console.error('Supabase error when creating note:', result.error);
        throw result.error;
      }
      
      console.log('Note created successfully:', result.data);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear local storage on successful save
      navigate('/notes');
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note. Please try again. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };
  
  const getMoodEmoji = (moodType) => {
    const emojis = {
      'Happy': '😊',
      'Sad': '😔',
      'Anxious': '😰',
      'Excited': '🤩',
      'Calm': '😌',
      'Frustrated': '😤',
      'Grateful': '🙏'
    };
    return emojis[moodType] || '';
  };

  return (
    <div className="note-form-page">
      <header className="page-header">
        <h1 className="page-title">Create New Note</h1>
      </header>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="note-form-container card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="form-input"
              required
              autoFocus
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
              className="form-input"
              required
            ></textarea>
          </div>
          
          <div className="form-row">
            <div className="form-group mood-select-container">
              <label htmlFor="mood" className="form-label">Mood (Optional)</label>
              <select
                id="mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="form-input form-select"
              >
                <option value="">Select mood</option>
                {moodOptions.map(option => (
                  <option key={option} value={option}>
                    {getMoodEmoji(option)} {option}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group tags-input-container">
              <label htmlFor="tags" className="form-label">Tags (Optional, comma-separated)</label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="work, personal, ideas, etc."
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => navigate('/notes')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Note
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}