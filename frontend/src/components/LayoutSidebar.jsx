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
  HistoryOutlined,
  BoxPlotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ProfileOutlined
} from "@ant-design/icons";
import api from "../api/axiosConfig"; 
import { useAuth } from "../context/AuthContext.jsx";

const { Sider } = Layout;

const LayoutSidebar = ({ selectedKey, onMenuClick, usuario, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    alertas: 0,
    entrada: 0,
    salida: 0,
  });
  const { logout } = useAuth();

  const cargarNotificaciones = async () => {
    try {
      const { data } = await api.get("/notificaciones"); 
      setCounts(data);
    } catch (error) {
      console.error("❌ Error al cargar notificaciones:", error);
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  const obtenerIniciales = () => {
    if (!usuario) return "US";
    const { nombre, apellidoPaterno } = usuario;
    const primeraLetraNombre = nombre ? nombre.charAt(0).toUpperCase() : '';
    const primeraLetraApellido = apellidoPaterno ? apellidoPaterno.charAt(0).toUpperCase() : '';
    return `${primeraLetraNombre}${primeraLetraApellido}` || "US";
  };

  const obtenerRol = () => {
    if (!usuario) return "Usuario";
    const roles = {
      'ENC': 'Encargada',
      'EMP': 'Empleado',
      'CON': 'Consultante'
    };
    return roles[usuario.acceso] || 'Usuario';
  };

  const obtenerColorAvatar = () => {
    if (!usuario) return '#1677ff';
    const colores = {
      'ENC': '#ff4d4f', // Rojo para Encargadas (autoridad)
      'EMP': '#1677ff', // Azul para Empleados (operativo)
      'CON': '#52c41a'  // Verde para Consultantes (lectura)
    };
    return colores[usuario.acceso] || '#1677ff';
  };

  const menuUsuario = {
    items: [
      {
        key: 'perfil',
        icon: <ProfileOutlined />,
        label: 'Mi Perfil',
        onClick: () => navigate('/perfilUsuario')
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Cerrar Sesión',
        danger: true,
        onClick: () => {
          logout();
          navigate('/');
        }
      },
    ],
  };

  const renderIconWithBadge = (IconComponent, count) => {
    if (collapsed && count > 0) {
      return (
        <Badge count={count} size="small" offset={[-5, 5]} style={{ backgroundColor: '#ff4d4f' }}>
          <IconComponent />
        </Badge>
      );
    }
    return <IconComponent />;
  };

  const renderLabelWithBadge = (label, count) => {
    if (!collapsed && count > 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{label}</span>
          <Badge count={count} size="small" style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }} />
        </div>
      );
    }
    return label;
  };

  const acceso = usuario?.acceso; // Extraemos el rol (CON, EMP, ENC)

  // 🛠️ MENÚ DINÁMICO BASADO EN ROLES
  const menuItems = [
    // 🟢 MÓDULOS UNIVERSALES (Lo ven CON, EMP y ENC)
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "inventario", icon: <BoxPlotOutlined />, label: "Inventario" },
    
    // 🔵 MÓDULOS OPERATIVOS (Lo ven EMP y ENC, pero NO los CON)
    ...(acceso === 'EMP' || acceso === 'ENC' ? [
      { key: "entrada", icon: renderIconWithBadge(ArrowDownOutlined, counts.entrada), label: renderLabelWithBadge("Entrada", counts.entrada) },
      { key: "salida", icon: renderIconWithBadge(ArrowUpOutlined, counts.salida), label: renderLabelWithBadge("Salida", counts.salida) },
      { key: "alertas", icon: renderIconWithBadge(ExclamationCircleOutlined, counts.alertas), label: renderLabelWithBadge("Alertas", counts.alertas) },
    ] : []),

    // 🔴 MÓDULOS ADMINISTRATIVOS (Acceso exclusivo para ENC)
    ...(acceso === 'ENC' ? [
      { key: "gestion-materiales", icon: <AppstoreOutlined />, label: "Gestión de Materiales" },
      { key: "agregar-material", icon: <PlusCircleOutlined />, label: "Agregar Material" },
      { key: "historial", icon: <HistoryOutlined />, label: "Historial" },
    ] : []),
  ];

  // Forzar bloqueo de rutas antiguas que ya no se usan
  const blockedMenuKeys = ["material-apartado"];
  const filteredMenuItems = menuItems.filter(item => !blockedMenuKeys.includes(item.key));

  return (
    <Sider
      width={250}
      collapsed={collapsed}
      collapsible
      trigger={null}
      style={{
        background: "#fff", height: "100vh", position: "fixed",
        left: 0, top: 0, overflowY: "auto", boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
        zIndex: 100,
      }}
    >
      <div style={{
        padding: "16px", textAlign: "center", borderBottom: "1px solid #f0f0f0",
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
      }}>
        {!collapsed && (
          <>
            <div>
              <h2 style={{ margin: 0, fontWeight: "bold", color: "#1677ff" }}>Sistema de Almacén</h2>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Gestión de Inventario</p>
            </div>
            <Tooltip title="Contraer menú">
              <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ cursor: "pointer", color: "#1677ff", fontSize: "16px" }} />
            </Tooltip>
          </>
        )}
        {collapsed && (
          <Tooltip title="Expandir menú" placement="right">
            <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ cursor: "pointer", color: "#1677ff", fontSize: "16px" }} />
          </Tooltip>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ borderRight: 0 }}
        onClick={onMenuClick}
        items={filteredMenuItems.map(item => ({ ...item, label: collapsed ? null : item.label }))}
      />

      <div style={{
        position: "absolute", bottom: 0, width: "100%", textAlign: "center",
        borderTop: "1px solid #f0f0f0", padding: "16px 8px", background: "#fff"
      }}>
        <Dropdown menu={menuUsuario} placement="topRight" arrow trigger={['click']}>
          <div style={{ cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background-color 0.3s' }}
               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <Avatar size={collapsed ? 40 : 32} style={{ backgroundColor: obtenerColorAvatar(), color: 'white', fontWeight: 'bold', fontSize: collapsed ? '16px' : '14px' }}>
                {obtenerIniciales()}
              </Avatar>
              {!collapsed && usuario && (
                <div style={{ marginLeft: '12px', textAlign: 'left', overflow: 'hidden', flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: '14px', lineHeight: '1.2', color: '#333' }}>
                    {usuario.nombre} {usuario.apellidoPaterno}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#666", lineHeight: '1.2' }}>{obtenerRol()}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#999", lineHeight: '1.2' }}>@{usuario.nombreUsuario}</p>
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