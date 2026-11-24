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
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          const rawBase = (import.meta.env.BASE_URL || '/').replace(/^\.\/?/, '/');
          const loginUrl = `${rawBase.endsWith('/') ? rawBase : rawBase + '/'}login`;
          window.location.href = loginUrl;
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

  // Medical Imaging (Radiographies, Scanners, IRM)
  getImagings: async (params?: any) => (await api.get('/clinical/imaging', { params })).data,
  createImaging: async (data: {
    title: string;
    type: string;
    date?: string;
    bodyPart?: string;
    facility?: string;
    notes?: string;
    fileUrl: string;
    fileName?: string;
    fileType?: string;
    patientId?: string;
  }) => (await api.post('/clinical/imaging', data)).data,
  deleteImaging: async (id: string) => (await api.delete(`/clinical/imaging/${id}`)).data,

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

  // Admin Rooms
  getRooms: async (params?: any) => (await api.get('/admin/rooms', { params })).data,
  getRoomById: async (id: string) => (await api.get(`/admin/rooms/${id}`)).data,
  createRoom: async (data: any) => (await api.post('/admin/rooms', data)).data,
  updateRoom: async (id: string, data: any) => (await api.put(`/admin/rooms/${id}`, data)).data,
  deleteRoom: async (id: string) => (await api.delete(`/admin/rooms/${id}`)).data,
  getRoomBookings: async (params?: any) => (await api.get('/admin/rooms/bookings', { params })).data,
  createRoomBooking: async (data: any) => (await api.post('/admin/rooms/bookings', data)).data,
  cancelRoomBooking: async (id: string) => (await api.put(`/admin/rooms/bookings/${id}/cancel`)).data,

  // Admin Employees
  getEmployees: async (params?: any) => (await api.get('/admin/employees', { params })).data,
  getEmployeeById: async (id: string) => (await api.get(`/admin/employees/${id}`)).data,
  createEmployee: async (data: any) => (await api.post('/admin/employees', data)).data,
  updateEmployee: async (id: string, data: any) => (await api.put(`/admin/employees/${id}`, data)).data,

  // Admin Doctors
  getAdminDoctors: async (params?: any) => (await api.get('/admin/doctors', { params })).data,
  createAdminDoctor: async (data: any) => (await api.post('/admin/doctors', data)).data,
  updateAdminDoctor: async (id: string, data: any) => (await api.put(`/admin/doctors/${id}`, data)).data,

  // Admin Patients (Administrative Only)
  getAdminPatients: async (params?: any) => (await api.get('/admin/patients', { params })).data,
  getAdminPatientById: async (id: string) => (await api.get(`/admin/patients/${id}`)).data,
  updateAdminPatient: async (id: string, data: any) => (await api.put(`/admin/patients/${id}`, data)).data,

  // Attendance (Staff & Admin)
  clockIn: async () => (await api.post('/attendance/clock-in')).data,
  clockOut: async () => (await api.post('/attendance/clock-out')).data,
  getMyAttendanceStatus: async () => (await api.get('/attendance/status')).data,
  getMyAttendances: async (params?: any) => (await api.get('/attendance/me', { params })).data,
  getAdminAttendances: async (params?: any) => (await api.get('/admin/attendance', { params })).data,
  getAttendanceSummary: async (params?: any) => (await api.get('/admin/attendance/summary', { params })).data,
  correctAttendance: async (data: any) => (await api.post('/admin/attendance/correction', data)).data,
  markAbsence: async (data: any) => (await api.post('/admin/attendance/mark-absence', data)).data,
  getWorkSchedules: async (userId: string) => (await api.get(`/admin/attendance/schedules/${userId}`)).data,
  updateWorkSchedules: async (userId: string, schedules: any[]) => 
    (await api.put(`/admin/attendance/schedules/${userId}`, { schedules })).data,
};
