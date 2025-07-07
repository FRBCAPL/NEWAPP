import { useState, useEffect } from 'react';
import { proposalService } from '../services/proposalService';

// This hook expects the backend to filter proposals using $in on 'divisions' array
export const useProposals = (playerName, division) => {
  const [pendingProposals, setPendingProposals] = useState([]);
  const [sentProposals, setSentProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const [pending, sent] = await Promise.all([
        proposalService.getPendingProposals(playerName, division),
        proposalService.getSentProposals(playerName, division)
      ]);
      
      setPendingProposals(pending.filter(p => ["pending", "countered"].includes(p.status)));
      setSentProposals(sent.filter(p => ["pending", "countered"].includes(p.status)));
      setError(null);
    } catch (err) {
      setError(err.message);
      setPendingProposals([]);
      setSentProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playerName && division) {
      fetchProposals();
    }
  }, [playerName, division]);

  return {
    pendingProposals,
    sentProposals,
    loading,
    error,
    refetch: fetchProposals
  };
}; 