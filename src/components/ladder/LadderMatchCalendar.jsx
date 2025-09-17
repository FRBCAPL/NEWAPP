import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DraggableModal from '../modal/DraggableModal';
import { BACKEND_URL } from '../../config.js';
import { isToday, formatDateForDisplay } from '../../utils/dateUtils';
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
      // Try the ladder-specific endpoint that includes position data
      const response = await fetch(`${BACKEND_URL}/api/ladder/front-range-pool-hub/ladders/499-under/matches`);
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      console.log('Calendar matches data:', data.matches);
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
    // Use local date string to avoid timezone issues
    const dateStr = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
    
    const dayMatches = matches.filter(match => {
      const matchDate = new Date(match.scheduledDate || match.completedDate);
      // Use local date string for comparison to avoid timezone issues
      const matchDateStr = matchDate.getFullYear() + '-' + 
                          String(matchDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(matchDate.getDate()).padStart(2, '0');
      return matchDateStr === dateStr;
    });
    console.log('Matches for date:', dateStr, dayMatches);
    return dayMatches;
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

  return createPortal(
    <DraggableModal
      open={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <img 
            src="/src/assets/LBC logo with address.png" 
            alt="LEGENDS" 
            style={{ 
              height: '32px', 
              width: 'auto',
              verticalAlign: 'middle'
            }} 
          />
          <span>Ladder Match Calendar</span>
          <span style={{ fontSize: '24px' }}>⚔️</span>
        </div>
      }
      maxWidth="1100px"
      maxHeight="750px"
      borderColor="#064e3b"
      glowColor="#8B5CF6"
      textColor="#FFD700"
      className="glossy-calendar-modal"
    >
      <div
        className="ladder-match-calendar"
        style={{
          maxHeight: 'calc(750px - 100px)',
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
              const isTodayDate = isToday(day);
              const dayMatches = getMatchesForDate(day);
              const isSelected = false; // No longer using selected state in calendar
              const hasMatches = dayMatches.length > 0;

              return (
                <div
                  key={`${day.getTime()}-${matches.length}`}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasMatches ? 'has-matches' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowMatchesModal(true);
                  }}
                >
                  <div className="day-number">{day.getDate()}</div>
                  {hasMatches && (
                    <div className="match-indicator">
                      <span className="match-count">{dayMatches.length}</span>
                    </div>
                  )}
                  {hasMatches && (
                    <div className="match-players">
                      {dayMatches.slice(0, 4).map((match, matchIndex) => {
                        // Check if either player is ranked in the top 5 of the ladder
                        const isTop5 = (match.player1?.ladderRank && match.player1.ladderRank <= 5) || 
                                      (match.player2?.ladderRank && match.player2.ladderRank <= 5);
                        return (
                          <div key={matchIndex} className={`player-names ${isTop5 ? 'top5-match' : ''}`}>
                            {isTop5 && <span className="crown-icon">👑</span>}
                            <div className="player-name">{match.player1?.firstName || 'TBD'}</div>
                            <div className="vs">vs</div>
                            <div className="player-name">{match.player2?.firstName || 'TBD'}</div>
                          </div>
                        );
                      })}
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
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img 
              src="/src/assets/LBC logo with address.png" 
              alt="LEGENDS" 
              style={{ 
                height: '50px', 
                width: 'auto',
                verticalAlign: 'middle'
              }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span>Matches for {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long' }) : ''}</span>
              <span style={{ fontSize: '0.9em', opacity: 0.9 }}>
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            </div>
            <span style={{ fontSize: '24px' }}>⚔️</span>
          </div>
        }
        maxWidth="600px"
        maxHeight="500px"
        borderColor="#064e3b"
        glowColor="#8B5CF6"
        textColor="#FFD700"
        className="glossy-calendar-modal"
      >
        <div className="day-matches-modal">
          {selectedDate && (
            <>
              {getMatchesForDate(selectedDate).length > 0 ? (
                <div className="matches-list">
                  {getMatchesForDate(selectedDate).map((match, index) => (
                    <div key={index} className="match-item">
                      <div className="match-players">
                        <div className="player-section">
                          <span className="player-role challenger">⚔️ Challenger</span>
                          <div className="player-name-row">
                            <span className="player-name">{match.player1?.firstName} {match.player1?.lastName}</span>
                            <span className="player-rank">#{match.player1?.position || 'N/A'}</span>
                          </div>
                        </div>
                        <span className="vs">vs</span>
                        <div className="player-section">
                          <span className="player-role defender">🛡️ Defender</span>
                          <div className="player-name-row">
                            <span className="player-name">{match.player2?.firstName} {match.player2?.lastName}</span>
                            <span className="player-rank">#{match.player2?.position || 'N/A'}</span>
                          </div>
                        </div>
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
    </DraggableModal>,
    document.body
  );
};

export default LadderMatchCalendar;
