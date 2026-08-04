import { apiRequest } from './apiClient';

export const rulesApi = {
  getAll() {
    return apiRequest('/rules');
  },

  getById(id) {
    return apiRequest(`/rules/${id}`);
  },

  create(payload) {
    return apiRequest('/rules', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  update(id, payload) {
    return apiRequest(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  remove(id) {
    return apiRequest(`/rules/${id}`, {
      method: 'DELETE'
    });
  }
};

