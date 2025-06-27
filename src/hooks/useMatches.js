import { useState, useEffect } from 'react';
import { matchService } from '../services/matchService';

// This hook expects the backend to filter matches using $in on 'divisions' array
export const useMatches = (playerName, division) => {
  const [matches, setMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [scheduledConfirmedMatches, setScheduledConfirmedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const [allMatches, completed] = await Promise.all([
        matchService.getAllMatches(playerName, division),
        matchService.getCompletedMatches(playerName, division)
      ]);
      
      // Debug: log raw backend data
      console.log('useMatches raw allMatches:', allMatches);
      console.log('useMatches raw completed:', completed);
      
      // Only include confirmed proposals as upcoming matches
      const upcoming = allMatches.filter(match => {
        return (
          match.status && match.status.toLowerCase() === 'confirmed' &&
          match.counterProposal &&
          (!match.counterProposal.phase || match.counterProposal.phase.toLowerCase() === 'scheduled') &&
          match.counterProposal.completed !== true
        );
      });
      // Completed: proposals that are confirmed and completed
      const completedMatches = allMatches.filter(match =>
        match.type === 'proposal' &&
        match.status && match.status.toLowerCase() === 'confirmed' &&
        match.counterProposal &&
        (!match.counterProposal.phase || match.counterProposal.phase.toLowerCase() === 'scheduled') &&
        match.counterProposal.completed === true
      );
      // Optionally sort upcoming by date
      upcoming.sort((a, b) => getMatchDateTime(a) - getMatchDateTime(b));
      setMatches(upcoming);
      setCompletedMatches(completedMatches);
      // Keep scheduledConfirmedMatches for legacy use (proposals only)
      const scheduledConfirmed = allMatches.filter(
        match =>
          match.type === 'proposal' &&
          match.status && match.status.toLowerCase() === 'confirmed' &&
          match.counterProposal &&
          (!match.counterProposal.phase || match.counterProposal.phase.toLowerCase() === 'scheduled') &&
          match.counterProposal.completed !== true
      );
      setScheduledConfirmedMatches(scheduledConfirmed);
      setError(null);
    } catch (err) {
      setError(err.message);
      setMatches([]);
      setCompletedMatches([]);
      setScheduledConfirmedMatches([]);
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
  }, [playerName, division]);

  return {
    matches,
    completedMatches,
    scheduledConfirmedMatches,
    loading,
    error,
    refetch: fetchMatches,
    markMatchCompleted: (matchToComplete) => {
      // Immediately update local state when a match is marked as completed
      setMatches(prev => prev.filter(match => match._id !== matchToComplete._id));
      setCompletedMatches(prev => {
        const completedMatch = { ...matchToComplete };
        if (!completedMatch.counterProposal) {
          completedMatch.counterProposal = {};
        }
        completedMatch.counterProposal.completed = true;
        return [...prev, completedMatch];
      });
    }
  };
}; 