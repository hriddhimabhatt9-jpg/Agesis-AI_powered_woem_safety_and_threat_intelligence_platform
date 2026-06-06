import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aegesis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track if we're currently refreshing to avoid infinite loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle 401 globally — attempt token refresh before forcing logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the token is expired and we have a refresh token, try refreshing
      if (error.response?.data?.tokenExpired) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('aegesis_refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            localStorage.setItem('aegesis_token', data.token);
            localStorage.setItem('aegesis_refresh_token', data.refreshToken);
            api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
            processQueue(null, data.token);
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            // Refresh failed — force logout
            forceLogout();
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
      }

      // No refresh token or non-expired 401 — force logout
      forceLogout();
    }
    return Promise.reject(error);
  }
);

function forceLogout() {
  localStorage.removeItem('aegesis_token');
  localStorage.removeItem('aegesis_refresh_token');
  localStorage.removeItem('aegesis_user');
  localStorage.removeItem('aegesis_needs_onboarding');
  if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
}

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

// Users
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateStep1: (data) => api.put('/users/profile/step1', data),
  updateStep2: (data) => api.put('/users/profile/step2', data),
  updatePrivacy: (data) => api.put('/users/privacy', data),
  updateSafetyMode: (mode) => api.put('/users/safety-mode', { mode }),
  updateDefenseMode: (mode) => api.put('/users/defense-mode', { mode }),
};

// AI
export const aiAPI = {
  analyzeMessage: (text) => api.post('/ai/analyze-message', { text }),
  decodeIntent: (conversation) => api.post('/ai/decode-intent', { conversation }),
  checkEscalation: (previousAnalyses) => api.post('/ai/check-escalation', { previousAnalyses }),
  digitalShadow: (query) => api.post('/ai/digital-shadow', { query }),
  detectImpersonation: (profile) => api.post('/ai/detect-impersonation', { profile }),
  simulateAttack: (scenario) => api.post('/ai/simulate-attack', { scenario }),
  emotionalSupport: (message) => api.post('/ai/emotional-support', { message }),
};

// Alerts
export const alertAPI = {
  triggerPanic: (location, contacts) => api.post('/alerts/panic', { location, contacts }),
  saveContacts: (contacts) => api.post('/alerts/save-contacts', { contacts }),
  getHistory: () => api.get('/alerts/history'),
  resolveAlert: (id) => api.put(`/alerts/${id}/resolve`),
};

// Evidence
export const evidenceAPI = {
  store: (data) => api.post('/evidence', data),
  getAll: () => api.get('/evidence'),
  delete: (id) => api.delete(`/evidence/${id}`),
};

// Reports
export const reportAPI = {
  generate: (options) => api.post('/reports/generate', options),
};

export default api;
