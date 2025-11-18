import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay una sesión activa al cargar la aplicación
  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        const token = localStorage.getItem('token');
        const usuarioGuardado = localStorage.getItem('usuario');
        
        if (token && usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
          setIsAuthenticated(true);
          
          // Configurar axios para enviar el token en todas las peticiones
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verificarAutenticacion();
  }, []);

  const login = async (nombreUsuario, password) => {
    try {
      setLoading(true);
      
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        nombreUsuario,
        password
      });

      const { usuario: usuarioData, token } = response.data;

      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));

      // Configurar axios para enviar el token en todas las peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Actualizar estado
      setUsuario(usuarioData);
      setIsAuthenticated(true);

      message.success(`¡Bienvenido ${usuarioData.nombreCompleto}!`);
      return { success: true, usuario: usuarioData };
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = error.response?.data?.detalle || 'Error al iniciar sesión';
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    // Limpiar headers de axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Resetear estado
    setUsuario(null);
    setIsAuthenticated(false);
    
    message.info('Sesión cerrada correctamente');
  };

  const value = {
    usuario,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};