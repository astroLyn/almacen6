import axios from 'axios';

// Configuración global de axios
axios.defaults.baseURL = 'http://localhost:3000/api';
axios.defaults.timeout = 10000;

// Interceptor para requests
axios.interceptors.request.use(
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

// Interceptor para responses
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axios;
