import React, { useEffect, useState } from "react";
import { Layout, Menu, Badge, Tooltip, Avatar, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  AppstoreOutlined,
  PlusCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  HistoryOutlined,
  SettingOutlined,
  BoxPlotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const { Sider } = Layout;

const LayoutSidebar = ({ selectedKey, onMenuClick, usuario }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    alertas: 0,
    entrada: 0,
    salida: 0,
  });
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  // 🔄 Obtener los conteos desde el backend
  const cargarNotificaciones = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/api/notificaciones"); 
      setCounts(data);
    } catch (error) {
      console.error("❌ Error al cargar notificaciones:", error);
    }
  };

  useEffect(() => {
    cargarNotificaciones();

    // ⏱️ Opcional: refrescar cada 60 segundos
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  // Función para obtener las iniciales del usuario
  const obtenerIniciales = () => {
    if (!usuario) return "US";
    
    const { nombre, apellidoPaterno } = usuario;
    const primeraLetraNombre = nombre ? nombre.charAt(0).toUpperCase() : '';
    const primeraLetraApellido = apellidoPaterno ? apellidoPaterno.charAt(0).toUpperCase() : '';
    
    return `${primeraLetraNombre}${primeraLetraApellido}` || "US";
  };

  // Función para obtener el nombre del rol basado en el código de acceso
  const obtenerRol = () => {
    if (!usuario) return "Usuario";
    
    const roles = {
      'ADM': 'Administrador',
      'ENC': 'Encargado',
      'USR': 'Usuario',
      'VIS': 'Visitante'
    };
    
    return roles[usuario.acceso] || 'Usuario';
  };

  // Función para obtener el color del avatar basado en el rol
  const obtenerColorAvatar = () => {
    if (!usuario) return '#1677ff';
    
    const colores = {
      'ADM': '#ff4d4f', // Rojo para administrador
      'ENC': '#52c41a', // Verde para encargado
      'USR': '#1677ff', // Azul para usuario
      'VIS': '#faad14'  // Amarillo para visitante
    };
    
    return colores[usuario.acceso] || '#1677ff';
  };

// En la sección del menú de usuario, reemplaza con:
const menuUsuario = {
  items: [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'Mi Perfil',
      onClick: () => navigate('/perfil') // ✅ Navegación al perfil
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      danger: true,
      onClick: logout
    },
  ],
};

  // Función para renderizar el icono con badge cuando está colapsado
  const renderIconWithBadge = (IconComponent, count) => {
    if (collapsed && count > 0) {
      return (
        <Badge 
          count={count} 
          size="small" 
          offset={[-5, 5]}
          style={{ 
            backgroundColor: '#ff4d4f',
          }} 
        >
          <IconComponent />
        </Badge>
      );
    }
    return <IconComponent />;
  };

  // Función para renderizar el label con badge cuando está expandido
  const renderLabelWithBadge = (label, count) => {
    if (!collapsed && count > 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{label}</span>
          <Badge 
            count={count} 
            size="small" 
            style={{ 
              backgroundColor: '#ff4d4f',
              marginLeft: 8
            }} 
          />
        </div>
      );
    }
    return label;
  };

  const menuItems = [
    { 
      key: "dashboard", 
      icon: <DashboardOutlined />, 
      label: "Dashboard" 
    },
    {
      key: "entrada",
      icon: renderIconWithBadge(ArrowDownOutlined, counts.entrada),
      label: renderLabelWithBadge("Entrada", counts.entrada),
    },
    {
      key: "salida",
      icon: renderIconWithBadge(ArrowUpOutlined, counts.salida),
      label: renderLabelWithBadge("Salida", counts.salida),
    },
    {
      key: "material-apartado",
      icon: <AppstoreOutlined />,
      label: "Material Apartado",
    },
    {
      key: "inventario",
      icon: <BoxPlotOutlined />,
      label: "Inventario",
    },
    {
      key: "gestion-materiales",
      icon: <PlusCircleOutlined />,
      label: "Gestión de Materiales",
    },
    {
      key: "agregar-material",
      icon: <PlusCircleOutlined />,
      label: "Agregar Material",
    },
    {
      key: "alertas",
      icon: renderIconWithBadge(ExclamationCircleOutlined, counts.alertas),
      label: renderLabelWithBadge("Alertas", counts.alertas),
    },
    { 
      key: "historial", 
      icon: <HistoryOutlined />, 
      label: "Historial" 
    },
  ];

  return (
    <Sider
      width={250}
      collapsed={collapsed}
      collapsible
      trigger={null} // Desactivamos el trigger por defecto para personalizarlo
      style={{
        background: "#fff",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        overflowY: "auto",
        boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header con botón de colapsar */}
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <>
            <div>
              <h2 style={{ margin: 0, fontWeight: "bold", color: "#1677ff" }}>
                Sistema de Almacén
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                Gestión de Inventario
              </p>
            </div>
            <Tooltip title="Contraer menú">
              <MenuFoldOutlined 
                onClick={() => setCollapsed(true)}
                style={{ 
                  cursor: "pointer", 
                  color: "#1677ff",
                  fontSize: "16px"
                }}
              />
            </Tooltip>
          </>
        )}
        {collapsed && (
          <Tooltip title="Expandir menú" placement="right">
            <MenuUnfoldOutlined 
              onClick={() => setCollapsed(false)}
              style={{ 
                cursor: "pointer", 
                color: "#1677ff",
                fontSize: "16px"
              }}
            />
          </Tooltip>
        )}
      </div>

      {/* Menú con Tooltips para cuando está colapsado */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ borderRight: 0 }}
        onClick={onMenuClick}
        items={menuItems.map(item => ({
          ...item,
          label: collapsed ? null : item.label, // Ocultar labels cuando está colapsado
        }))}
      />

      {/* Footer del sidebar con información del usuario */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          textAlign: "center",
          borderTop: "1px solid #f0f0f0",
          padding: "16px 8px",
          background: "#fff"
        }}
      >
        <Dropdown 
          menu={menuUsuario} 
          placement="topRight" 
          arrow
          trigger={['click']}
        >
          <div style={{ 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <Avatar 
                size={collapsed ? 40 : 32}
                style={{ 
                  backgroundColor: obtenerColorAvatar(),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: collapsed ? '16px' : '14px'
                }}
              >
                {obtenerIniciales()}
              </Avatar>
              
              {!collapsed && usuario && (
                <div style={{ 
                  marginLeft: '12px', 
                  textAlign: 'left',
                  overflow: 'hidden',
                  flex: 1
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontWeight: "bold",
                    fontSize: '14px',
                    lineHeight: '1.2',
                    color: '#333'
                  }}>
                    {usuario.nombre} {usuario.apellidoPaterno}
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: 12, 
                    color: "#666",
                    lineHeight: '1.2'
                  }}>
                    {obtenerRol()}
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: 10, 
                    color: "#999",
                    lineHeight: '1.2'
                  }}>
                    @{usuario.nombreUsuario}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Dropdown>
      </div>
    </Sider>
  );
};

export default LayoutSidebar;