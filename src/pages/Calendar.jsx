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

  if (loading && !notes.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error loading calendar: {error}</p>
        <button 
          onClick={fetchNotes}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="calendar-container p-4">
      <div className="calendar-header flex items-center justify-between mb-6">
        <button 
          onClick={previousMonth}
          className="prev-month-btn px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Prev
        </button>
        
        <h2 className="text-2xl font-semibold text-gray-800">{format(currentDate, 'MMMM yyyy')}</h2>
        
        <button 
          onClick={nextMonth}
          className="next-month-btn px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div className="calendar-grid bg-white rounded-lg shadow-md overflow-hidden">
        <div className="weekday-header grid grid-cols-7 bg-blue-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday p-2 text-center text-gray-600 font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="days-grid grid grid-cols-7">
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
                  calendar-day relative p-1 min-h-[100px] border border-gray-100
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-800'}
                  ${isToday ? 'today bg-blue-50' : ''}
                  ${isSelected ? 'selected bg-blue-100' : ''}
                  ${dayNotes.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}
                  transition duration-150
                `}
              >
                <div className={`
                  day-number text-right p-1 font-medium
                  ${isToday ? 'text-blue-600' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                
                {dayNotes.length > 0 && (
                  <div className="day-notes mt-1">
                    {dayNotes.length > 2 ? (
                      <div className="notes-badge px-2 py-1 bg-blue-500 text-white text-xs rounded-full inline-block">
                        {dayNotes.length} notes
                      </div>
                    ) : (
                      dayNotes.slice(0, 2).map(note => (
                        <div key={note.id} className="note-preview p-1 my-1 text-xs truncate bg-blue-50 rounded border-l-2 border-blue-400">
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
        <div className="selected-day-notes mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-3">
            Notes for {format(selectedDay, 'MMMM d, yyyy')}
          </h3>
          <div className="notes-list space-y-3">
            {dayNotes.map(note => (
              <Link 
                to={`/notes/${note.id}`}
                key={note.id} 
                className="note-item block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition duration-150"
              >
                <h4 className="font-medium text-gray-800">{note.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.content}</p>
                {note.mood && (
                  <div className="note-mood mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      Mood: {note.mood}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="add-note-btn fixed bottom-6 right-6">
        <Link 
          to="/notes/new" 
          className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default Calendar; 