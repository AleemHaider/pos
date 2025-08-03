import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

// Products API calls
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
};

// Categories API calls
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (category) => api.post('/categories', category),
};

// Sales API calls
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  create: (sale) => api.post('/sales', sale),
  update: (id, sale) => api.put(`/sales/${id}`, sale),
  delete: (id) => api.delete(`/sales/${id}`),
  refund: (id, refundData) => api.post(`/sales/${id}/refund`, refundData),
};

// Customers API calls
export const customersAPI = {
  getAll: () => api.get('/customers'),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`),
  getById: (id) => api.get(`/customers/${id}`),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Analytics API calls
export const analyticsAPI = {
  getSalesAnalytics: (params) => api.get('/analytics/sales', { params }),
  getInventoryAnalytics: () => api.get('/analytics/inventory'),
  getCustomerAnalytics: () => api.get('/analytics/customers'),
};

// Users API calls
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (user) => api.post('/users', user),
  update: (id, user) => api.put(`/users/${id}`, user),
  delete: (id) => api.delete(`/users/${id}`),
  getById: (id) => api.get(`/users/${id}`),
};

export default api;