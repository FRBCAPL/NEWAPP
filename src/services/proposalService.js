import ApiService from './api';

export const proposalService = {
  async getPendingProposals(playerName, division) {
    return ApiService.get(`/api/proposals/by-name?receiverName=${encodeURIComponent(playerName)}&division=${encodeURIComponent(division)}`);
  },

  async getSentProposals(playerName, division) {
    return ApiService.get(`/api/proposals/by-sender?senderName=${encodeURIComponent(playerName)}&division=${encodeURIComponent(division)}`);
  },

  async updateProposalStatus(proposalId, status, note) {
    return ApiService.patch(`/api/proposals/${proposalId}/status`, { status, note });
  },

  async createProposal(proposalData) {
    return ApiService.post('/api/proposals', proposalData);
  },

  async counterProposal(proposalId, counterData) {
    return ApiService.patch(`/api/proposals/${proposalId}/counter`, counterData);
  },

  async markCompleted(proposalId) {
    return ApiService.patch(`/api/matches/completed/${proposalId}`);
  },

  async cancelProposal(proposalId) {
    return ApiService.post(`/api/proposals/${proposalId}/cancel`);
  }
}; 