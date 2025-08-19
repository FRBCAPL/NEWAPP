import ApiService from './api';

export const matchService = {
  async getAllMatches(playerName, division, phase) {
    const params = new URLSearchParams({
      player: playerName,
      ...(division && { division }),
      ...(phase && { phase })
    });
    return ApiService.get(`/api/matches/all-matches?${params}`);
  },

  async getCompletedMatches(playerName, division) {
    const params = new URLSearchParams({
      player: playerName,
      ...(division && { division })
    });
    return ApiService.get(`/api/matches/completed-matches?${params}`);
  },

  async createMatch(matchData) {
    return ApiService.post('/api/matches', matchData);
  },

  // Add method to get all matches (for admin/overview purposes)
  async getAllMatchesForDivision(division) {
    const params = division ? `?division=${encodeURIComponent(division)}` : '';
    return ApiService.get(`/api/matches/all-matches${params}`);
  },

  // Add method to get match stats
  async getMatchStats(playerName, division) {
    return ApiService.get(`/api/matches/stats/${encodeURIComponent(playerName)}/${encodeURIComponent(division)}`);
  }
}; 