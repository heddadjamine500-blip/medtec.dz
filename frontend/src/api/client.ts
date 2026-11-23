import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medtec_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler (e.g., 401 unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthUrl) {
        localStorage.removeItem('medtec_token');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth
  login: async (email: string, password: string) => 
    (await api.post('/auth/login', { email, password })).data,
  register: async (data: any) => 
    (await api.post('/auth/register', data)).data,
  getMe: async () => 
    (await api.get('/auth/me')).data,
  updateProfile: async (data: any) => 
    (await api.put('/auth/profile', data)).data,

  // Stats
  getStats: async () => (await api.get('/clinical/stats')).data,
  
  // Clinical
  getDoctors: async () => (await api.get('/clinical/doctors')).data,
  getPatients: async () => (await api.get('/clinical/patients')).data,

  // Consultations
  getConsultations: async (params?: any) => (await api.get('/clinical/consultations', { params })).data,
  createConsultation: async (data: any) => (await api.post('/clinical/consultations', data)).data,

  // Admin User Management
  getUsers: async () => (await api.get('/clinical/users')).data,
  updateUser: async (id: string, data: any) => (await api.put(`/clinical/users/${id}`, data)).data,
  deleteUser: async (id: string) => (await api.delete(`/clinical/users/${id}`)).data,

  // Appointments
  getAppointments: async (params?: any) => (await api.get('/appointments', { params })).data,
  createAppointment: async (data: { doctorId: string; patientId?: string; date: string; status?: string }) => 
    (await api.post('/appointments', data)).data,
  updateAppointmentStatus: async (id: string, status: string) => 
    (await api.patch(`/appointments/${id}/status`, { status })).data,
  deleteAppointment: async (id: string) => 
    (await api.delete(`/appointments/${id}`)).data,

  // Prescriptions
  getPrescriptions: async (params?: any) => (await api.get('/prescriptions', { params })).data,
  createPrescription: async (data: { 
    doctorId?: string; 
    patientId: string; 
    notes?: string; 
    items: { medicationName: string; dosage: string; duration: string }[] 
  }) => (await api.post('/prescriptions', data)).data,

  // Pharmacy
  getInventory: async () => (await api.get('/pharmacy/inventory')).data,
  addInventoryItem: async (data: { 
    name: string; 
    description?: string; 
    stock: number; 
    price: number; 
    supplier?: string; 
    barcode?: string;
    expiryDate?: string;
  }) => (await api.post('/pharmacy/inventory', data)).data,
  updateInventoryItem: async (id: string, data: any) => 
    (await api.put(`/pharmacy/inventory/${id}`, data)).data,
  deleteInventoryItem: async (id: string) => 
    (await api.delete(`/pharmacy/inventory/${id}`)).data,
  updateStock: async (id: string, delta?: number, stock?: number, reason?: string) => 
    (await api.patch(`/pharmacy/inventory/${id}/stock`, { delta, stock, reason })).data,
  getOrders: async () => (await api.get('/pharmacy/orders')).data,
  createOrder: async (data: any) => (await api.post('/pharmacy/orders', data)).data,
  updateOrderStatus: async (id: string, status: string) => 
    (await api.patch(`/pharmacy/orders/${id}/status`, { status })).data,
};
