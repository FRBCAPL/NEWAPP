import { useState, useEffect } from 'react';
import { matchService } from '../services/matchService';

export const useMatches = (playerName, division, phase) => {
  const [scheduledConfirmedMatches, setScheduledConfirmedMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const allMatches = await matchService.getAllMatches(playerName, division, phase);
      
      // Use only the top-level 'completed' field - handle both false and undefined
      const scheduled = allMatches.filter(match => match.status === 'confirmed' && (match.completed === false || match.completed === undefined));
      const completed = allMatches.filter(match => match.status === 'confirmed' && match.completed === true);
      
      // Sort by date
      scheduled.sort((a, b) => getMatchDateTime(a) - getMatchDateTime(b));
      completed.sort((a, b) => getMatchDateTime(a) - getMatchDateTime(b));
      setScheduledConfirmedMatches(scheduled);
      setCompletedMatches(completed);
      setError(null);
    } catch (err) {
      setError(err.message);
      setScheduledConfirmedMatches([]);
      setCompletedMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function for date sorting
  const getMatchDateTime = (match) => {
    if (match.date && match.time) {
      const parts = match.date.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        let timeStr = match.time.trim().toUpperCase();
        let timeParts = timeStr.split(' ');
        let timePart = timeParts[0];
        let ampm = timeParts[1];
        let hourMinute = timePart.split(':');
        let hour = parseInt(hourMinute[0], 10);
        let minute = parseInt(hourMinute[1], 10);
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = (minute || 0).toString().padStart(2, '0');
        const time24 = `${hourStr}:${minuteStr}`;
        return new Date(`${isoDate}T${time24}:00`);
      }
    }
    return new Date(0);
  };

  useEffect(() => {
    if (playerName && division) {
      fetchMatches();
    }
  }, [playerName, division, phase]);

  return {
    matches: scheduledConfirmedMatches,
    completedMatches,
    scheduledConfirmedMatches, // for legacy
    loading,
    error,
    refetch: fetchMatches,
    markMatchCompleted: (matchToComplete) => {
      // Immediately update local state when a match is marked as completed
      setScheduledConfirmedMatches(prev => prev.filter(match => match._id !== matchToComplete._id));
      setCompletedMatches(prev => {
        const completedMatch = { ...matchToComplete, completed: true };
        return [...prev, completedMatch];
      });
    },
    updateCompletedMatch: (updatedMatch) => {
      // Update a completed match (e.g., when winner is edited)
      setCompletedMatches(prev => prev.map(match => 
        match._id === updatedMatch._id ? updatedMatch : match
      ));
    }
  };
}; 