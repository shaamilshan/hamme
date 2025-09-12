import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Health check
  health: () => api.get('/api/health'),
  
  // User endpoints (to be implemented)
  getUsers: () => api.get('/api/users'),
  getUser: (id: string) => api.get(`/api/users/${id}`),
  createUser: (userData: any) => api.post('/api/users', userData),
  updateUser: (id: string, userData: any) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id: string) => api.delete(`/api/users/${id}`),
  
  // Auth endpoints (to be implemented)
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  register: (userData: { email: string; password: string; name: string }) =>
    api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  
  // Profile endpoints
  updateDateOfBirth: (dateOfBirth: string) =>
    api.patch('/api/profile/dob', { dateOfBirth }),
  updateProfilePicture: (profilePicture: string) =>
    api.patch('/api/profile/profile-picture', { profilePicture }),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData()
    formData.append('profilePicture', file)
    return api.post('/api/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  getProfile: () =>
    api.get('/api/profile/profile'),
  
  // Matching endpoints
  getPublicProfile: (userId: string) =>
    api.get(`/api/matching/public/${userId}`),
  submitChoice: (targetUserId: string, choice: 'date' | 'friends' | 'reject') =>
    api.post('/api/matching/choice', { targetUserId, choice }),
  getPendingProfiles: () =>
    api.get('/api/matching/pending'),
  getMatches: () =>
    api.get('/api/matching/matches'),
};