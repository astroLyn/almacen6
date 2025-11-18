import React, { useState } from "react";
import { Layout, Spin } from "antd";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LayoutSidebar from "./components/LayoutSidebar.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Importa las páginas
import Dashboard from "./pages/Dashboard";
import Entrada from "./pages/Entrada";
import Salida from "./pages/Salida";
import MaterialApartado from "./pages/MaterialApartado";
import Inventario from "./pages/Inventario.jsx";
import GestionMateriales from "./pages/GestionMateriales";
import AgregarMaterial from "./pages/AgregarMaterial";
import Alertas from "./pages/Alertas";
import Historial from "./pages/Historial";
import Configuracion from "./pages/Configuracion";
import Login from "./pages/login";
import PerfilUsuario from "./pages/perfilUsuario";
import "antd/dist/reset.css";

const { Content } = Layout;

const AppContent = () => {
  const { isAuthenticated, loading, usuario } = useAuth();
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const navigate = useNavigate();

  const handleMenuClick = (e) => {
    if (e.key === "logout") return; // Manejar logout en el sidebar
    
    setSelectedKey(e.key);
    navigate(`/${e.key === "dashboard" ? "" : e.key}`);
  };

  // Mostrar spinner mientras verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Cargando..." />
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Si está autenticado, mostrar la aplicación principal
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <LayoutSidebar 
        selectedKey={selectedKey} 
        onMenuClick={handleMenuClick}
        usuario={usuario}
      />
      <Layout style={{ marginLeft: 250, background: "#f5f5f5" }}>
        <Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/entrada" element={<Entrada />} />
            <Route path="/salida" element={<Salida />} />
            <Route path="/material-apartado" element={<MaterialApartado />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/gestion-materiales" element={<GestionMateriales />} />
            <Route path="/agregar-material" element={<AgregarMaterial />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/perfil" element={<PerfilUsuario />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
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
