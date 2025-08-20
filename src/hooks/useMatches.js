import { useState, useEffect } from 'react';
import { getMatchesByStatus, getPlayerMatches } from '../services/matchService';
import { proposalService } from '../services/proposalService';

export const useMatches = (playerName, division, phase) => {
  const [scheduledConfirmedMatches, setScheduledConfirmedMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      
      // Use the new match system endpoints
      const [scheduledMatches, completedMatchesData] = await Promise.all([
        getMatchesByStatus(division, 'scheduled'),
        getMatchesByStatus(division, 'completed')
      ]);
      
             // Filter matches for the current player and map them to expected format
       const playerScheduled = scheduledMatches.filter(match => 
         match.player1Id === playerName || match.player2Id === playerName
       ).map(match => {
         // Map Match object fields to what MatchDetailsModal expects
         const isCurrentUserPlayer1 = match.player1Id === playerName;
         const currentUser = isCurrentUserPlayer1 ? match.player1Id : match.player2Id;
         const opponent = isCurrentUserPlayer1 ? match.player2Id : match.player1Id;
         
         // Convert scheduledDate to date and time strings
         const scheduledDate = new Date(match.scheduledDate);
         const dateStr = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD
         const timeStr = scheduledDate.toLocaleTimeString('en-US', { 
           hour: 'numeric', 
           minute: '2-digit',
           hour12: true 
         }); // h:mm AM/PM
         
         return {
           ...match,
           // Map to expected field names
           player: currentUser,
           opponent: opponent,
           senderName: match.player1Id,
           receiverName: match.player2Id,
           date: dateStr,
           time: timeStr,
           // Add missing fields with defaults
           gameType: match.gameType || '8 ball',
           raceLength: match.raceLength || 5,
           type: 'scheduled'
         };
       });
       
       const playerCompleted = completedMatchesData.filter(match => 
         match.player1Id === playerName || match.player2Id === playerName
       ).map(match => {
         // Map completed matches similarly
         const isCurrentUserPlayer1 = match.player1Id === playerName;
         const currentUser = isCurrentUserPlayer1 ? match.player1Id : match.player2Id;
         const opponent = isCurrentUserPlayer1 ? match.player2Id : match.player1Id;
         
         const scheduledDate = new Date(match.scheduledDate);
         const dateStr = scheduledDate.toISOString().split('T')[0];
         const timeStr = scheduledDate.toLocaleTimeString('en-US', { 
           hour: 'numeric', 
           minute: '2-digit',
           hour12: true 
         });
         
         return {
           ...match,
           player: currentUser,
           opponent: opponent,
           senderName: match.player1Id,
           receiverName: match.player2Id,
           date: dateStr,
           time: timeStr,
           gameType: match.gameType || '8 ball',
           raceLength: match.raceLength || 5,
           type: 'completed'
         };
       });
      
      // Also fetch confirmed proposals for this player
      let confirmedProposals = [];
      try {
        // Get proposals where this player is the receiver and status is confirmed
        const pendingProposals = await proposalService.getPendingProposals(playerName, division);
        const sentProposals = await proposalService.getSentProposals(playerName, division);
        
        // Filter for confirmed proposals
        const allProposals = [...pendingProposals, ...sentProposals];
        confirmedProposals = allProposals.filter(proposal => 
          proposal.status === 'confirmed' && 
          (proposal.senderName === playerName || proposal.receiverName === playerName)
        );
        
        // Convert confirmed proposals to match-like objects for display
        const confirmedProposalMatches = confirmedProposals.map(proposal => {
          // Determine which player is the current user and which is the opponent
          const isCurrentUserSender = proposal.senderName === playerName;
          const currentUser = isCurrentUserSender ? proposal.senderName : proposal.receiverName;
          const opponent = isCurrentUserSender ? proposal.receiverName : proposal.senderName;
          
          return {
            _id: proposal._id,
            type: 'proposal',
            status: 'confirmed',
            // Map fields to match the expected structure in MatchDetailsModal
            player1Id: proposal.senderName,
            player2Id: proposal.receiverName,
            // For MatchDetailsModal - these are the key fields it looks for
            // player should be the current user, opponent should be the other player
            player: currentUser,
            opponent: opponent,
            senderName: proposal.senderName,
            receiverName: proposal.receiverName,
            // Date handling - ensure consistency with All Upcoming Matches modal
            scheduledDate: proposal.date ? new Date(proposal.date) : new Date(),
            date: proposal.date,                // For MatchDetailsModal
            time: proposal.time,                // For MatchDetailsModal
            location: proposal.location,        // For MatchDetailsModal
            message: proposal.message,
            gameType: proposal.gameType,
            raceLength: proposal.raceLength,
            // Additional fields that might be needed
            completed: proposal.completed || false,
            winner: proposal.winner || null
          };
        });
        
        // Combine scheduled matches with confirmed proposals
        const allScheduledMatches = [...playerScheduled, ...confirmedProposalMatches];
        
        // Sort by date
        allScheduledMatches.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
        playerCompleted.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
        
        setScheduledConfirmedMatches(allScheduledMatches);
        setCompletedMatches(playerCompleted);
      } catch (proposalError) {
        console.warn('Error fetching confirmed proposals:', proposalError);
        // Fallback to just scheduled matches if proposal fetch fails
        playerScheduled.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
        playerCompleted.sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
        
        setScheduledConfirmedMatches(playerScheduled);
        setCompletedMatches(playerCompleted);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.message);
      setScheduledConfirmedMatches([]);
      setCompletedMatches([]);
    } finally {
      setLoading(false);
    }
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