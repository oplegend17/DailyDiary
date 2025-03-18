import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function NoteDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
          console.error('Error fetching note:', error);
          throw error;
        }
        
        if (!data) {
          setError('Note not found');
          return;
        }
        
        setNote(data);
      } catch (err) {
        console.error('Failed to fetch note:', err);
        setError('Failed to load note. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNote();
  }, [id, user]);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      navigate('/notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
      setLoading(false);
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
  
  if (error) {
    return (
      <div className="empty-state">
        <p className="empty-state-text">{error}</p>
        <Link to="/notes" className="btn btn-primary">Back to Notes</Link>
      </div>
    );
  }
  
  if (!note) {
    return (
      <div className="empty-state">
        <p className="empty-state-text">Note not found</p>
        <Link to="/notes" className="btn btn-primary">Back to Notes</Link>
      </div>
    );
  }
  
  return (
    <div className="note-detail">
      <div className="note-detail-header">
        <h1 className="note-detail-title">{note.title}</h1>
        <div className="note-detail-meta">
          <span className="note-date">
            {format(new Date(note.created_at), 'MMM d, yyyy')}
          </span>
          {note.mood && (
            <span className="badge badge-primary">
              {note.mood}
            </span>
          )}
        </div>
      </div>
      
      {note.tags && note.tags.length > 0 && (
        <div className="note-detail-tags">
          {note.tags.map(tag => (
            <span key={tag} className="note-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="note-detail-content card">
        <p>{note.content}</p>
      </div>
      
      <div className="note-detail-actions">
        <Link to={`/notes/${id}/edit`} className="btn btn-primary">
          Edit
        </Link>
        <button 
          onClick={handleDelete} 
          className="btn btn-danger"
        >
          Delete
        </button>
        <Link to="/notes" className="btn btn-outline">
          Back to Notes
        </Link>
      </div>
    </div>
  );
} 