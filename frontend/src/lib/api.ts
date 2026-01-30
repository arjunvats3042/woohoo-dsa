import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: { username: string; password: string; apiKey?: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/profile'),
  updateApiKey: (apiKey: string) => api.put('/apikey', { apiKey }),
};

// Problem APIs
export const problemAPI = {
  getAll: (topic?: string, difficulty?: string) => {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    if (difficulty) params.append('difficulty', difficulty);
    return api.get(`/problems?${params.toString()}`);
  },
  getById: (id: string) => api.get(`/problems/${id}`),
  getTopics: () => api.get('/topics'),
};

// Progress APIs
export const progressAPI = {
  getAll: () => api.get('/progress'),
  getByProblem: (problemId: string) => api.get(`/progress/${problemId}`),
  updateNotes: (problemId: string, notes: string) =>
    api.put(`/progress/${problemId}/notes`, { notes }),
};

// Submission APIs
export const submissionAPI = {
  submit: (data: { problemId: string; code: string; language?: string }) =>
    api.post('/submit', data),
  getByProblem: (problemId: string) => api.get(`/submissions/${problemId}`),
};

// Comment APIs
export const commentAPI = {
  getAll: (problemId: string) => api.get(`/comments/${problemId}`),
  create: (problemId: string, content: string) => api.post('/comments', { problemId, content }),
  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};

export default api;
