import React, { useState } from "react";
import { Layout, Spin } from "antd";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import LayoutSidebar from "./components/LayoutSidebar.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import Dashboard from "./pages/Dashboard";
import Entrada from "./pages/Entrada";
import Salida from "./pages/Salida";
import GestionMateriales from "./pages/GestionMateriales";
import AgregarMaterial from "./pages/AgregarMaterial";
import Inventario from "./pages/Inventario.jsx";
import Alertas from "./pages/Alertas";
import Historial from "./pages/Historial";
import Configuracion from "./pages/Configuracion";
import Login from "./pages/login";
import PerfilUsuario from "./pages/perfilUsuario";
import "antd/dist/reset.css";

const { Content } = Layout;

// ==========================================
// 🛠️ COMPONENTES HELPER (Deben ir primero)
// ==========================================
const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Cargando..." />
  </div>
);

// ==========================================
// 🛡️ GUARDIANES DE RUTAS (MIDDLEWARES)
// ==========================================

// 1. Candado Básico: ¿Está logueado?
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// 2. Candado Inverso: ¿Ya está logueado?
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// 3. 🔒 Candado Estricto: ¿Tiene el Rol correcto?
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;

  // Si no hay usuario o el rol no está autorizado, redireccionamos al Dashboard
  if (!user || !allowedRoles.includes(user.acceso)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// ==========================================
// 🏗️ ESTRUCTURA PRINCIPAL DEL SISTEMA
// ==========================================
const MainLayout = () => {
  const { user } = useAuth();
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    const pathToKeyMap = {
      '/': 'dashboard',
      '/entrada': 'entrada',
      '/salida': 'salida',
      '/inventario': 'inventario',
      '/gestion-materiales': 'gestion-materiales',
      '/agregar-material': 'agregar-material',
      '/alertas': 'alertas',
      '/historial': 'historial',
      '/configuracion': 'configuracion',
      '/perfilUsuario': 'perfil'
    };
    
    const currentKey = pathToKeyMap[location.pathname] || 'dashboard';
    setSelectedKey(currentKey);
  }, [location.pathname]);

  const handleMenuClick = (e) => {
    if (e.key === "logout") return;
    
    setSelectedKey(e.key);
    
    const routeMap = {
      "dashboard": "/",
      "entrada": "/entrada",
      "salida": "/salida", 
      "inventario": "/inventario",
      "gestion-materiales": "/gestion-materiales",
      "agregar-material": "/agregar-material",
      "alertas": "/alertas",
      "historial": "/historial",
      "configuracion": "/configuracion",
      "perfil": "/perfilUsuario"
    };
    
    const route = routeMap[e.key];
    if (route) {
      navigate(route);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <LayoutSidebar 
        selectedKey={selectedKey} 
        onMenuClick={handleMenuClick}
        usuario={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <Layout style={{ marginLeft: collapsed ? 80 : 250, background: "#f5f5f5", transition: "all 0.2s" }}>
        <Content style={{ padding: 24 }}>
          <Routes>
            {/* 🟢 RUTAS PÚBLICAS INTERNAS (Todos los roles acceden) */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/perfilUsuario" element={<PerfilUsuario />} />
            
            {/* 🟡 RUTAS OPERATIVAS (Solo Encargadas y Empleados, bloqueadas para 'CON') */}
            <Route path="/entrada" element={
              <RoleRoute allowedRoles={['ENC', 'EMP']}>
                <Entrada />
              </RoleRoute>
            } />
            <Route path="/salida" element={
              <RoleRoute allowedRoles={['ENC', 'EMP']}>
                <Salida />
              </RoleRoute>
            } />
            <Route path="/gestion-materiales" element={
              <RoleRoute allowedRoles={['ENC', 'EMP']}>
                <GestionMateriales />
              </RoleRoute>
            } />
            <Route path="/agregar-material" element={
              <RoleRoute allowedRoles={['ENC', 'EMP']}>
                <AgregarMaterial />
              </RoleRoute>
            } />

            {/* 🔴 RUTAS ADMINISTRATIVAS (Solo Encargadas 'ENC') */}
            <Route path="/configuracion" element={
              <RoleRoute allowedRoles={['ENC']}>
                <Configuracion />
              </RoleRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={ <PublicRoute><Login /></PublicRoute> } />
      <Route path="/*" element={ <ProtectedRoute><MainLayout /></ProtectedRoute> } />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

export default App;
