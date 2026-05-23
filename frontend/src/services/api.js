import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject JWT token
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

// Response interceptor to handle token expiry / unauthenticated requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and reload if unauthorized
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    // FastAPI OAuth2PasswordRequestForm expects URLSearchParams / form-data
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    
    const response = await api.post('/api/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  register: async (email, password, fullname, role) => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      fullname,
      role,
    });
    return response.data;
  },
};

export const ticketService = {
  getAll: async () => {
    const response = await api.get('/api/tickets');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  create: async (description, language = 'English') => {
    const response = await api.post('/api/tickets', {
      description,
      language,
    });
    return response.data;
  },

  update: async (id, updates) => {
    const response = await api.put(`/api/tickets/${id}`, updates);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/tickets/${id}`);
    return response.data;
  },

  merge: async (id, parentId) => {
    const response = await api.post(`/api/tickets/${id}/merge?parent_id=${parentId}`);
    return response.data;
  },
};

export const analyticsService = {
  getSummary: async () => {
    const response = await api.get('/api/analytics');
    return response.data;
  },
};

export default api;
