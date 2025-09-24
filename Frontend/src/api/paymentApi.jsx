import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return userInfo?.token;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Payment API functions
export const paymentApi = {
  // Get all payments with filtering and pagination
  getAllPayments: async (params = {}) => {
    try {
      const response = await api.get('/payment', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Get payment by ID
  getPaymentById: async (paymentId) => {
    try {
      const response = await api.get(`/payment/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Get payments by user
  getPaymentsByUser: async (userId, params = {}) => {
    try {
      const response = await api.get(`/payment/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error;
    }
  },

  // Get payments by order
  getPaymentsByOrder: async (orderId) => {
    try {
      const response = await api.get(`/payment/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order payments:', error);
      throw error;
    }
  },

  // Update payment status
  updatePaymentStatus: async (paymentId, status) => {
    try {
      const response = await api.put(`/payment/${paymentId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Process refund
  processRefund: async (paymentId, refundData) => {
    try {
      const response = await api.post(`/payment/${paymentId}/refund`, refundData);
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  },

  // Get payment statistics
  getPaymentStats: async (params = {}) => {
    try {
      const response = await api.get('/payment/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  },

  // Create payment
  createPayment: async (paymentData) => {
    try {
      const response = await api.post('/payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Update payment
  updatePayment: async (paymentId, paymentData) => {
    try {
      const response = await api.put(`/payment/${paymentId}`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Delete payment
  deletePayment: async (paymentId) => {
    try {
      const response = await api.delete(`/payment/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
};

export default paymentApi;

