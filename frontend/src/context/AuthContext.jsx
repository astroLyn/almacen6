import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axiosConfig'; // o el path correcto a tu api.js

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al cargar la página
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('usuario'); 
      
      console.log('🔍 Verificando autenticación:', { token, userData });
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = {
          ...parsedUser,
          acceso: parsedUser.acceso?.toString().trim().toUpperCase() || 'CON'
        };

        console.log('✅ Usuario encontrado en localStorage:', normalizedUser);
        
        setUser(normalizedUser);
        setIsAuthenticated(true);
      } else {
        console.log('❌ No hay usuario autenticado');
        logout();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('🔐 Iniciando sesión para:', username);
      
      const response = await api.post('/auth/login', {
        nombreUsuario: username,
        password: password
      });
      
      const { usuario, token } = response.data;
      const normalizedUser = {
        ...usuario,
        acceso: usuario.acceso?.toString().trim().toUpperCase() || 'CON'
      };
      
      console.log('✅ Login exitoso, usuario normalizado:', normalizedUser);
      
      if (!token) throw new Error("El servidor no devolvió un token de seguridad");
      
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(normalizedUser)); 
      
      setUser(normalizedUser);
      setIsAuthenticated(true);
      
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('❌ Error en login:', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión');
    
    // Limpiar todo asegurando que los nombres coincidan
    localStorage.removeItem('token');
    localStorage.removeItem('usuario'); // 🛠️ CORRECCIÓN
    localStorage.removeItem('rememberMe');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,                  
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};