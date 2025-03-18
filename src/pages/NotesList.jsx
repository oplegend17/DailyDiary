import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function NotesList() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  useEffect(() => {
    async function fetchNotes() {
      if (!user) return;
      
      try {
        console.log('Fetching notes for user:', user.id);
        setLoading(true);
        
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching notes:', error);
          throw error;
        }
        
        console.log('Fetched notes:', data);
        setNotes(data || []);
      } catch (err) {
        console.error('Failed to fetch notes:', err);
        setError('Failed to load notes. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNotes();
  }, [user]);
  
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.tags && note.tags.some(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );
  
  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      'Happy': '😊',
      'Sad': '😢',
      'Anxious': '😰',
      'Excited': '🤩',
      'Calm': '😌',
      'Frustrated': '😤',
      'Grateful': '🙏',
      'neutral': '😐'
    };
    
    return moodEmojis[mood] || '';
  };

  const getRandomColor = (tag) => {
    // List of pleasing pastel colors
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-teal-100 text-teal-800'
    ];
    
    // Use the string's characters to deterministically choose a color
    let sum = 0;
    for (let i = 0; i < tag.length; i++) {
      sum += tag.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };
  
  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deleteInProgress) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setDeleteInProgress(true);
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setNotes(notes.filter(note => note.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };
  
  return (
    <div className="notes-page">
      <header className="page-header">
        <h1 className="page-title">My Notes</h1>
        <div className="view-toggle">
          <button 
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('grid')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Grid
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setViewMode('list')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
        </div>
      </header>
      
      <div className="search-container">
        <div className="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading notes...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className={`notes-${viewMode}`}>
          {filteredNotes.length === 0 ? (
            <div className="empty-state">
              <img src="/empty-notes.svg" alt="No notes found" className="empty-state-image" />
              <h3 className="empty-state-title">
                {searchTerm ? 'No matching notes found' : 'You have no notes yet'}
              </h3>
              <p className="empty-state-text">
                {searchTerm 
                  ? `Try a different search term or clear the search`
                  : `Click the button below to create your first note`}
              </p>
              {!searchTerm && (
                <Link to="/create" className="btn btn-primary">Create Your First Note</Link>
              )}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className="note-card">
                <Link to={`/notes/${note.id}`} className="note-link">
                  <h2 className="note-title">{note.title}</h2>
                  <p className="note-excerpt">
                    {note.content.length > 150 
                      ? note.content.substring(0, 150) + '...' 
                      : note.content}
                  </p>
                  <div className="note-meta">
                    <span className="note-date">
                      {format(new Date(note.created_at), 'MMM d, yyyy')}
                    </span>
                    {note.mood && (
                      <span className="note-mood">
                        {getMoodEmoji(note.mood)}
                      </span>
                    )}
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="note-tags">
                      {note.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="note-tag"
                          style={{ backgroundColor: getRandomColor(tag) }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
                <div className="note-actions">
                  <Link 
                    to={`/edit/${note.id}`} 
                    className="note-action-btn edit-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </Link>
                  <button 
                    className="note-action-btn delete-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    disabled={deleteInProgress === note.id}
                  >
                    {deleteInProgress === note.id ? (
                      <span className="delete-spinner"></span>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      <Link to="/create" className="floating-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  );
} 