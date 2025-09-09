import React, { useState, useEffect } from 'react';
import DraggableModal from '../modal/DraggableModal';
import { BACKEND_URL } from '../../config.js';
import './LadderMatchCalendar.css';

const LadderMatchCalendar = ({ isOpen, onClose }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMatchesModal, setShowMatchesModal] = useState(false);

  // Fetch confirmed matches
  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/matches/confirmed`);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError('Failed to load matches');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMatches();
    }
  }, [isOpen]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Get matches for a specific date
  const getMatchesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return matches.filter(match => {
      const matchDate = new Date(match.scheduledDate || match.completedDate);
      return matchDate.toISOString().split('T')[0] === dateStr;
    });
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <DraggableModal
      open={isOpen}
      onClose={onClose}
      title="📅 Ladder Match Calendar"
      maxWidth="720px"
      maxHeight="800px"
    >
      <div
        className="ladder-match-calendar"
        style={{
          maxHeight: 'calc(800px - 100px)',
          overflowY: 'auto'
        }}
      >
        {/* Calendar Header */}
        <div className="calendar-header">
          <button 
            className="nav-button"
            onClick={() => navigateMonth(-1)}
          >
            ←
          </button>
          <h2 className="month-year">{monthName}</h2>
          <button 
            className="nav-button"
            onClick={() => navigateMonth(1)}
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Day headers */}
          <div className="day-headers">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const dayMatches = getMatchesForDate(day);
              const isSelected = false; // No longer using selected state in calendar

              return (
                <div
                  key={index}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayMatches.length > 0 ? 'has-matches' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowMatchesModal(true);
                  }}
                >
                  <div className="day-number">{day.getDate()}</div>
                  {dayMatches.length > 0 && (
                    <div className="match-indicator">
                      <span className="match-count">{dayMatches.length}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* Loading and Error States */}
        {loading && (
          <div className="loading-state">
            <p>Loading matches...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={fetchMatches} className="retry-button">
              Try Again
            </button>
            <button onClick={() => setError('')} className="dismiss-button">
              Dismiss
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-dot has-matches"></div>
            <span>Has matches</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot today"></div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Day Matches Modal */}
      <DraggableModal
        open={showMatchesModal}
        onClose={() => setShowMatchesModal(false)}
        title={`📅 Matches for ${selectedDate ? formatDate(selectedDate) : ''}`}
        maxWidth="600px"
        maxHeight="500px"
      >
        <div className="day-matches-modal">
          {selectedDate && (
            <>
              {getMatchesForDate(selectedDate).length > 0 ? (
                <div className="matches-list">
                  {getMatchesForDate(selectedDate).map((match, index) => (
                    <div key={index} className="match-item">
                      <div className="match-players">
                        <span className="player1">{match.player1?.firstName} {match.player1?.lastName}</span>
                        <span className="vs">vs</span>
                        <span className="player2">{match.player2?.firstName} {match.player2?.lastName}</span>
                      </div>
                      <div className="match-details">
                        <span className="match-type">{match.matchType}</span>
                        {match.venue && <span className="venue">📍 {match.venue}</span>}
                        {match.scheduledTime && <span className="time">🕐 {match.scheduledTime}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-matches">No matches scheduled for this date</p>
              )}
            </>
          )}
        </div>
      </DraggableModal>
    </DraggableModal>
  );
};

export default LadderMatchCalendar;
