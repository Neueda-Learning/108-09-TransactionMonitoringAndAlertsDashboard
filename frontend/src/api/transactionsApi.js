import { apiRequest } from './apiClient';

export const transactionsApi = {
  getAll() {
    return apiRequest('/transactions');
  },

  getByTransactionId(transactionId) {
    return apiRequest(`/transactions/${encodeURIComponent(transactionId)}`);
  },

  create(payload) {
    return apiRequest('/transactions/add', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  update(transactionId, payload) {
    return apiRequest(`/transactions/${encodeURIComponent(transactionId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  remove(transactionId) {
    return apiRequest(`/transactions/${encodeURIComponent(transactionId)}`, {
      method: 'DELETE'
    });
  }
};

