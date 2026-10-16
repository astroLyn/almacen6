import axios from 'axios';

// 1. Creamos una INSTANCIA dedicada (no modificamos el axios global)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
});

// 2. Interceptor para requests (Inyectar JWT)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔍 Axios Request - Token en localStorage:', !!token, token ? token.substring(0, 20) + '...' : 'null');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token agregado al header Authorization');
    } else {
      console.log('❌ No hay token en localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Interceptor para responses (Manejo de sesiones expiradas)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🚨 Si el token no sirve, limpiamos y fuera
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      // Redirigimos al login
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

// Exportamos la instancia
export default api;
