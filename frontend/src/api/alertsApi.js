import { apiRequest } from './apiClient';

export const alertsApi = {
  getAll() {
    return apiRequest('/alerts');
  },

  getById(id) {
    return apiRequest(`/alerts/${id}`);
  },

  updateStatus(id, status) {
    return apiRequest(`/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  remove(id) {
    return apiRequest(`/alerts/${id}`, {
      method: 'DELETE'
    });
  }
};

