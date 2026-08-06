import { API_BASE_URL } from '../constants';

async function parseResponse(response) {
  const text = await response.text();

  if (!response.ok) {
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}
    const message = data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!text || text.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  return parseResponse(response);
}

