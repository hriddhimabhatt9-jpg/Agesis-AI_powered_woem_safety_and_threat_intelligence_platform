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

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aegesis_token');
      localStorage.removeItem('aegesis_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
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
  getHistory: () => api.get('/ai/history'),
};

// Alerts
export const alertAPI = {
  triggerPanic: (location, contacts) => api.post('/alerts/panic', { location, contacts }),
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
