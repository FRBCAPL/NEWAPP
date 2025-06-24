import ApiService from './api';

export const userService = {
  async getUser(idOrEmail) {
    return ApiService.get(`/api/user/${encodeURIComponent(idOrEmail)}`);
  },

  async syncUsers() {
    return ApiService.post('/admin/sync-users');
  }
}; 