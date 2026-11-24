import { create } from 'zustand';
import { apiService } from '../api/client';

export interface UserProfile {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN' | 'EMPLOYEE';
  isActive?: boolean;
  patientInfo?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address?: string | null;
    birthDate?: string | null;
  };
  doctorInfo?: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
    licenseNb: string;
    phone?: string | null;
  };
  pharmacyInfo?: {
    id: string;
    name: string;
    address: string;
    phone?: string | null;
  };
  employeeInfo?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    department?: string | null;
    phone?: string | null;
    status?: string;
  };
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  loadUser: () => Promise<UserProfile | null>;
  updateProfile: (data: any) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('medtec_token'),
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiService.login(email, password);
      localStorage.setItem('medtec_token', res.token);
      set({ token: res.token, user: res.user, isLoading: false });
      return res.user;
    } catch (err: any) {
      const msg = err.response?.data?.message 
        || (err.code === 'ERR_NETWORK' || !err.response 
          ? 'Serveur inaccessible : assurez-vous que le backend tourne sur le port 10000.' 
          : 'Identifiants incorrects');
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiService.register(data);
      if (res.token) {
        localStorage.setItem('medtec_token', res.token);
        set({ token: res.token, user: res.user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors de l'inscription";
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('medtec_token');
    set({ token: null, user: null, error: null });
  },

  loadUser: async () => {
    const token = get().token || localStorage.getItem('medtec_token');
    if (!token) {
      set({ user: null });
      return null;
    }

    try {
      set({ isLoading: true });
      const res = await apiService.getMe();
      set({ user: res.user, isLoading: false });
      return res.user;
    } catch (err) {
      localStorage.removeItem('medtec_token');
      set({ token: null, user: null, isLoading: false });
      return null;
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await apiService.updateProfile(data);
      set({ user: res.user, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
}));
