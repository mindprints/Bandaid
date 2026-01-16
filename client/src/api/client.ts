import axios from 'axios';

// Use relative URL to leverage Vite proxy in development
// In production, set VITE_API_URL environment variable or use relative path
const API_BASE_URL = import.meta.env.PROD
  ? '/api'  // Production: same domain
  : (import.meta.env.VITE_API_URL || '/api');  // Development

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on 401 (unless already on login page)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
