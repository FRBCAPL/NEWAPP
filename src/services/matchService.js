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
  }
}; 