// API Configuration for local dev, Render, and Vercel deployments
export const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') 
  : '';

/**
 * Resolves an API endpoint path to the full URL in production,
 * or keeps it relative in development (so Vite dev proxy routes it).
 *
 * @param {string} endpoint - e.g. '/api/buses/live'
 * @returns {string} - e.g. 'https://schoolway-api.onrender.com/api/buses/live' or '/api/buses/live'
 */
export const apiUrl = (endpoint) => {
  if (!API_BASE_URL) return endpoint;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};
