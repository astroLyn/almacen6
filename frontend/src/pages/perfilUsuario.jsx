import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Row, Col, Typography, Divider, 
  message, Tag, Avatar, Space, Alert, Select, Tabs, Table, 
  Modal, Popconfirm 
} from 'antd';
import {
  UserOutlined, SaveOutlined, LockOutlined, SafetyOutlined, 
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined 
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
// 🔒 IMPORTANTE: Usamos tu configuración segura de Axios
import api from '../api/axiosConfig'; 

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PerfilUsuario = () => {
  const { user } = useAuth(); 
  const [form] = Form.useForm();
  const [formNuevoUsuario] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // 🔄 Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.nombreUsuario) return;
      
      try {
        setCargandoDatos(true);
        // 1. Datos del perfil propio
        const resPerfil = await api.get(`/auth/usuarios/${user.nombreUsuario}`);
        setDatosUsuario(resPerfil.data);
        form.setFieldsValue(resPerfil.data);

        // 2. Si es ENCARGADA, cargar lista de todos los usuarios
        if (user.acceso === 'ENC') {
          const resLista = await api.get('/auth/usuarios');
          setUsuarios(resLista.data);
        }
      } catch (error) {
        console.error('❌ Error:', error);
        message.error('Error al sincronizar datos del servidor');
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarDatos();
  }, [user, form]);

  // 💾 Actualizar perfil personal
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        nombre: values.nombre,
        apellidoPaterno: values.apellidoPaterno,
        apellidoMaterno: values.apellidoMaterno,
        // No permitimos que un usuario se cambie el rol a sí mismo desde aquí
        nuevoPasswordPlano: values.nuevaContrasena || null
      };

      if (!values.nuevaContrasena) delete payload.nuevoPasswordPlano;

      await api.put(`/auth/usuarios/${user.nombreUsuario}`, payload);
      message.success('Perfil actualizado correctamente');
      
      // Actualizar vista local
      setDatosUsuario({...datosUsuario, ...payload});
    } catch (error) {
      message.error(error.response?.data?.detalle || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // ➕ Crear nuevo usuario (Solo para ENC)
  const onFinishNuevoUsuario = async (values) => {
    setCreandoUsuario(true);
    try {
      await api.post('/auth/usuarios', values);
      message.success('✅ Nuevo usuario registrado con éxito');
      setModalNuevoUsuario(false);
      formNuevoUsuario.resetFields();
      
      // Recargar lista
      const resLista = await api.get('/auth/usuarios');
      setUsuarios(resLista.data);
    } catch (error) {
      message.error(error.response?.data?.detalle || 'Error al crear usuario');
    } finally {
      setCreandoUsuario(false);
    }
  };

  // 🗑️ Eliminar usuario
  const eliminarUsuario = async (nombreUsuario) => {
    try {
      await api.delete(`/auth/usuarios/${nombreUsuario}`);
      message.success('Usuario eliminado');
      setUsuarios(usuarios.filter(u => u.nombreUsuario !== nombreUsuario));
    } catch (error) {
      message.error('No se pudo eliminar al usuario');
    }
  };

  // 🎨 Helpers de Estilo para los Roles del Proyecto
  const obtenerColorRol = (acceso) => {
    const colores = { 'ENC': 'purple', 'EMP': 'blue', 'CON': 'cyan' };
    return colores[acceso] || 'default';
  };

  const obtenerNombreRol = (acceso) => {
    const nombres = { 'ENC': 'Encargada (Admin)', 'EMP': 'Empleado (Operador)', 'CON': 'Consultante (Lectura)' };
    return nombres[acceso] || 'Usuario';
  };

  const columnasUsuarios = [
    {
      title: 'Usuario',
      dataIndex: 'nombreUsuario',
      key: 'nombreUsuario',
      render: (text) => <Text strong>@{text}</Text>,
    },
    {
      title: 'Nombre Completo',
      key: 'nombreCompleto',
      render: (_, r) => `${r.nombre} ${r.apellidoPaterno} ${r.apellidoMaterno}`,
    },
    {
      title: 'Rol',
      dataIndex: 'acceso',
      key: 'acceso',
      render: (acc) => <Tag color={obtenerColorRol(acc)}>{obtenerNombreRol(acc)}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          {record.nombreUsuario !== user?.nombreUsuario ? (
            <Popconfirm
              title="¿Eliminar usuario?"
              onConfirm={() => eliminarUsuario(record.nombreUsuario)}
              okText="Eliminar"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>Borrar</Button>
            </Popconfirm>
          ) : <Tag>Tú</Tag>}
        </Space>
      ),
    },
  ];

  if (cargandoDatos) return <Card loading title="Cargando perfil..." style={{ margin: 24 }} />;

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card hoverable style={{ textAlign: 'center' }}>
            <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
            <Title level={3} style={{ marginTop: 16 }}>{datosUsuario?.nombre}</Title>
            <Tag color={obtenerColorRol(datosUsuario?.acceso)}>{obtenerNombreRol(datosUsuario?.acceso)}</Tag>
            <Divider />
            <div style={{ textAlign: 'left' }}>
              <Text type="secondary">ID de Usuario:</Text> <br />
              <Text strong>@{datosUsuario?.nombreUsuario}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card>
            <Tabs defaultActiveKey="1">
              <TabPane tab={<span><UserOutlined /> Mi Perfil</span>} key="1">
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <Row gutter={16}>
                    <Col span={8}><Form.Item label="Nombre" name="nombre" rules={[{required: true}]}><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item label="Apellido P." name="apellidoPaterno" rules={[{required: true}]}><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item label="Apellido M." name="apellidoMaterno"><Input /></Form.Item></Col>
                  </Row>
                  <Form.Item label="Cambiar Contraseña" name="nuevaContrasena">
                    <Input.Password placeholder="Dejar en blanco para mantener actual" prefix={<LockOutlined />} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>Guardar Cambios</Button>
                </Form>
              </TabPane>

              {/* 🔒 PESTAÑA PROTEGIDA: Solo visible para la Encargada */}
              {user?.acceso === 'ENC' && (
                <TabPane tab={<span><SafetyOutlined /> Gestión de Usuarios</span>} key="2">
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Title level={4}>Usuarios del Almacén</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalNuevoUsuario(true)}>Nuevo Usuario</Button>
                  </div>
                  <Table columns={columnasUsuarios} dataSource={usuarios} rowKey="nombreUsuario" size="small" />
                </TabPane>
              )}
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Modal creación (ENC Only) */}
      <Modal
        title="Registrar Nuevo Personal"
        open={modalNuevoUsuario}
        onCancel={() => setModalNuevoUsuario(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={formNuevoUsuario} layout="vertical" onFinish={onFinishNuevoUsuario}>
          <Form.Item label="Usuario (Login)" name="user" rules={[{required: true}]}><Input prefix={<UserOutlined />} /></Form.Item>
          <Form.Item label="Contraseña Inicial" name="passwordPlano" rules={[{required: true, min: 6}]}><Input.Password prefix={<LockOutlined />} /></Form.Item>
          <Row gutter={8}>
            <Col span={12}><Form.Item label="Nombre" name="nombre" rules={[{required: true}]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Apellido" name="apellidoPaterno" rules={[{required: true}]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item label="Rol del Sistema" name="acceso" rules={[{required: true}]}>
            <Select>
              <Option value="ENC">Encargada (Acceso Total)</Option>
              <Option value="EMP">Empleado (Operación)</Option>
              <Option value="CON">Consultante (Solo Lectura)</Option>
            </Select>
          </Form.Item>
          <Button type="primary" block htmlType="submit" loading={creandoUsuario}>Registrar Usuario</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default PerfilUsuario;