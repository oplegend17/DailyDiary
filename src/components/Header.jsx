import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Focus search input when mobile search is shown
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // For now, just navigate to notes page - later we can implement actual search
      navigate(`/notes?search=${encodeURIComponent(searchTerm)}`);
      // Close mobile search after submitting
      setShowMobileSearch(false);
    }
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Mobile Search Button */}
        <button 
          className="mobile-search-toggle" 
          onClick={toggleMobileSearch}
          aria-label="Toggle search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        {/* Desktop Search / Mobile Search (when expanded) */}
        <div className={`search-container ${showMobileSearch ? 'mobile-search-visible' : ''} ${isSearchFocused ? 'focused' : ''}`}>
          <form onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="search-input"
              />
              
              {searchTerm && (
                <button 
                  type="button" 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <button 
              type="submit" 
              className="search-button"
              disabled={!searchTerm.trim()}
            >
              Search
            </button>
            
            {showMobileSearch && (
              <button 
                type="button" 
                className="cancel-search-btn"
                onClick={() => {
                  setShowMobileSearch(false);
                  setSearchTerm('');
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
        
        <div className="user-profile">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || 'G'}
          </div>
          <span className="user-email">
            {user?.email || 'Guest'}
          </span>
        </div>
      </div>
    </header>
  );
} 