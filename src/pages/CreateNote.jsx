import { useState } from 'react';
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
      navigate('/notes');
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note. Please try again. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="note-form-page">
      <div className="page-header">
        <h1 className="page-title">Create New Note</h1>
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
              onClick={() => navigate('/notes')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 