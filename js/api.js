/**
 * StudentBazaar — Centralized API Client (js/api.js)
 * Handles REST API communication, credentials/cookies, error handling,
 * and dynamic base URL detection.
 */

const API_BASE_URL = (function () {
  if (typeof window !== 'undefined' && window.__STUDENTBAZAAR_API_URL__) {
    return window.__STUDENTBAZAAR_API_URL__;
  }
  // If running locally, check whether served from port 5001 or another port
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001/api/v1';
  }
  return '/api/v1';
})();

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Support local token fallback if cookie is restricted
  const savedToken = localStorage.getItem('sb_auth_token');
  if (savedToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${savedToken}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Transmit HTTP-only auth cookies
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => ({
      success: false,
      statusCode: response.status,
      message: 'Failed to parse server response.'
    }));

    if (!response.ok) {
      const errorMsg = result.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.details = result;
      throw error;
    }

    return result;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

window.API_BASE_URL = API_BASE_URL;
window.apiRequest = apiRequest;
