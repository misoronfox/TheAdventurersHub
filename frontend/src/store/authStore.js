import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  
  // Función para guardar el token cuando hacemos login
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  
  // Función para cerrar sesión
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  }
}));