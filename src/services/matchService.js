import ApiService from './api';

export const matchService = {
  async getAllMatches(playerName, division) {
    const params = new URLSearchParams({
      player: playerName,
      ...(division && { division })
    });
    return ApiService.get(`/api/all-matches?${params}`);
  },

  async getCompletedMatches(playerName, division) {
    const params = new URLSearchParams({
      player: playerName,
      ...(division && { division })
    });
    return ApiService.get(`/api/completed-matches?${params}`);
  },

  async createMatch(matchData) {
    return ApiService.post('/api/matches', matchData);
  }
}; 