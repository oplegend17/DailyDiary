import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';

function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayNotes, setDayNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, [currentDate, user]);

  async function fetchNotes() {
    if (!user) return;
    
    try {
      setLoading(true);
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      // We'll fetch one week before and after the current month to display in the calendar
      const extendedStartDate = startOfWeek(startDate);
      const extendedEndDate = endOfWeek(endDate);

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', extendedStartDate.toISOString())
        .lte('created_at', extendedEndDate.toISOString());

      if (error) throw error;
      console.log('Calendar notes fetched:', data?.length || 0);
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching calendar notes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function getNotesForDate(date) {
    return notes.filter(note => 
      isSameDay(new Date(note.created_at), date)
    );
  }

  function previousMonth() {
    setCurrentDate(subMonths(currentDate, 1));
  }

  function nextMonth() {
    setCurrentDate(addMonths(currentDate, 1));
  }

  function handleDayClick(day) {
    setSelectedDay(day);
    const dayNotes = getNotesForDate(day);
    setDayNotes(dayNotes);
  }

  // Generate calendar days including the last days of previous month and first days of next month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

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

  if (loading && !notes.length) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>Error loading calendar: {error}</p>
        <button 
          onClick={fetchNotes}
          className="btn btn-primary mt-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <header className="page-header">
        <h1 className="page-title">Calendar</h1>
      </header>

      <div className="calendar-container">
        <div className="calendar-header">
          <button 
            onClick={previousMonth}
            className="month-nav-btn prev-btn"
            aria-label="Previous month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Prev</span>
          </button>
          
          <h2 className="current-month">{format(currentDate, 'MMMM yyyy')}</h2>
          
          <button 
            onClick={nextMonth}
            className="month-nav-btn next-btn"
            aria-label="Next month"
          >
            <span>Next</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="calendar-grid">
          <div className="weekday-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="days-grid">
            {calendarDays.map((day) => {
              const dayNotes = getNotesForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    calendar-day
                    ${!isCurrentMonth ? 'other-month' : ''}
                    ${isToday ? 'today' : ''}
                    ${isSelected ? 'selected' : ''}
                    ${dayNotes.length > 0 ? 'has-notes' : ''}
                  `}
                >
                  <div className="day-number">
                    {format(day, 'd')}
                  </div>
                  
                  {dayNotes.length > 0 && (
                    <div className="day-notes">
                      {dayNotes.length > 2 ? (
                        <div className="notes-count">
                          {dayNotes.length} notes
                        </div>
                      ) : (
                        dayNotes.slice(0, 2).map(note => (
                          <div key={note.id} className="note-preview">
                            {note.title}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && dayNotes.length > 0 && (
          <div className="selected-day-notes">
            <h3 className="selected-day-title">
              Notes for {format(selectedDay, 'MMMM d, yyyy')}
            </h3>
            <div className="notes-list">
              {dayNotes.map(note => (
                <Link 
                  to={`/notes/${note.id}`}
                  key={note.id} 
                  className="day-note-card"
                >
                  <h4 className="day-note-title">{note.title}</h4>
                  <p className="day-note-excerpt">{note.content}</p>
                  {note.mood && (
                    <div className="day-note-mood">
                      <span className="mood-badge">
                        {getMoodEmoji(note.mood)} {note.mood}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link to="/notes/new" className="floating-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default Calendar; 