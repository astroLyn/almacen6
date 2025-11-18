import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  message,
  Tag,
  Avatar,
  Space,
  Alert,
  Select,
  Tabs,
  Table,
  Modal,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  LockOutlined,
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PerfilUsuario = () => {
  const { usuario } = useAuth();
  const [form] = Form.useForm();
  const [formNuevoUsuario] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [tiposAcceso, setTiposAcceso] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // Cargar datos del usuario, tipos de acceso y lista de usuarios
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargandoDatos(true);
        
        // Cargar datos específicos del usuario
        const response = await axios.get(`http://localhost:3000/api/auth/usuarios/${usuario.nombreUsuario}`);
        setDatosUsuario(response.data);
        
        // Cargar tipos de acceso disponibles
        const responseAccesos = await axios.get('http://localhost:3000/api/auth/tipos-acceso');
        setTiposAcceso(responseAccesos.data);
        
        // Cargar lista de usuarios
        const responseUsuarios = await axios.get('http://localhost:3000/api/auth/usuarios');
        setUsuarios(responseUsuarios.data);
        
        // Establecer valores iniciales del formulario
        form.setFieldsValue(response.data);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        message.error('Error al cargar los datos del perfil');
      } finally {
        setCargandoDatos(false);
      }
    };

    if (usuario) {
      cargarDatos();
    }
  }, [usuario, form]);

  // Actualizar perfil personal
  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('📤 Actualizando perfil:', values);

      const payload = {
        nombre: values.nombre,
        apellidoPaterno: values.apellidoPaterno,
        apellidoMaterno: values.apellidoMaterno,
        acceso: values.acceso,
        nuevoPasswordPlano: values.nuevaContrasena || null
      };

      // Eliminar el campo de contraseña si está vacío
      if (!values.nuevaContrasena) {
        delete payload.nuevoPasswordPlano;
      }

      const response = await axios.put(
        `http://localhost:3000/api/auth/usuarios/${usuario.nombreUsuario}`,
        payload
      );

      message.success('Perfil actualizado correctamente');
      console.log('✅ Perfil actualizado:', response.data);

      // Recargar los datos actualizados
      const userResponse = await axios.get(`http://localhost:3000/api/auth/usuarios/${usuario.nombreUsuario}`);
      setDatosUsuario(userResponse.data);

    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      message.error(error.response?.data?.detalle || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo usuario
  const onFinishNuevoUsuario = async (values) => {
    setCreandoUsuario(true);
    try {
      console.log('📤 Creando nuevo usuario:', values);

      const payload = {
        user: values.user,
        passwordPlano: values.passwordPlano,
        nombre: values.nombre,
        apellidoPaterno: values.apellidoPaterno,
        apellidoMaterno: values.apellidoMaterno,
        acceso: values.acceso
      };

      const response = await axios.post(
        'http://localhost:3000/api/auth/usuarios',
        payload
      );

      message.success('Usuario creado correctamente');
      console.log('✅ Usuario creado:', response.data);

      // Cerrar modal y limpiar formulario
      setModalNuevoUsuario(false);
      formNuevoUsuario.resetFields();

      // Recargar lista de usuarios
      const responseUsuarios = await axios.get('http://localhost:3000/api/auth/usuarios');
      setUsuarios(responseUsuarios.data);

    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      message.error(error.response?.data?.detalle || 'Error al crear el usuario');
    } finally {
      setCreandoUsuario(false);
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (nombreUsuario) => {
    try {
      await axios.delete(`http://localhost:3000/api/auth/usuarios/${nombreUsuario}`);
      message.success('Usuario eliminado correctamente');
      
      // Recargar lista de usuarios
      const responseUsuarios = await axios.get('http://localhost:3000/api/auth/usuarios');
      setUsuarios(responseUsuarios.data);
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      message.error(error.response?.data?.detalle || 'Error al eliminar el usuario');
    }
  };

  const obtenerColorRol = (acceso) => {
    const colores = {
      'ADM': 'red',
      'ENC': 'green',
      'USR': 'blue',
      'VIS': 'orange'
    };
    return colores[acceso] || 'default';
  };

  const obtenerNombreRol = (acceso) => {
    const roles = {
      'ADM': 'Administrador',
      'ENC': 'Encargado',
      'USR': 'Usuario',
      'VIS': 'Visitante'
    };
    return roles[acceso] || 'Usuario';
  };

  // Columnas para la tabla de usuarios
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
      render: (_, record) => (
        <Text>
          {record.nombre} {record.apellidoPaterno} {record.apellidoMaterno}
        </Text>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'acceso',
      key: 'acceso',
      render: (acceso) => (
        <Tag color={obtenerColorRol(acceso)}>
          {obtenerNombreRol(acceso)}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => {
              // Aquí podrías implementar la vista de detalles
              message.info(`Ver detalles de ${record.nombreUsuario}`);
            }}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => {
              // Aquí podrías implementar la edición
              message.info(`Editar ${record.nombreUsuario}`);
            }}
          >
            Editar
          </Button>
          {record.nombreUsuario !== usuario.nombreUsuario && (
            <Popconfirm
              title="¿Eliminar usuario?"
              description={`¿Está seguro de eliminar a ${record.nombreUsuario}?`}
              onConfirm={() => eliminarUsuario(record.nombreUsuario)}
              okText="Sí"
              cancelText="No"
            >
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />}
              >
                Eliminar
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (cargandoDatos) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading={true}>
          <div style={{ height: 200 }}></div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {/* Información del Usuario */}
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                style={{ 
                  backgroundColor: '#1677ff',
                  marginBottom: 16
                }}
                icon={<UserOutlined />}
              />
              <Title level={3} style={{ margin: '8px 0' }}>
                {datosUsuario?.nombre} {datosUsuario?.apellidoPaterno}
              </Title>
              <Tag color={obtenerColorRol(datosUsuario?.acceso)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {obtenerNombreRol(datosUsuario?.acceso)}
              </Tag>
              <Text type="secondary" display="block" style={{ marginTop: 8 }}>
                @{datosUsuario?.nombreUsuario}
              </Text>
            </div>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>Nombre completo:</Text>
                <br />
                <Text>
                  {datosUsuario?.nombre} {datosUsuario?.apellidoPaterno} {datosUsuario?.apellidoMaterno}
                </Text>
              </div>
              
              <div>
                <Text strong>Rol de acceso:</Text>
                <br />
                <Tag color={obtenerColorRol(datosUsuario?.acceso)}>
                  {datosUsuario?.acceso} - {obtenerNombreRol(datosUsuario?.acceso)}
                </Tag>
              </div>

              <div>
                <Text strong>Última actualización:</Text>
                <br />
                <Text type="secondary">Hoy</Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Contenido principal con pestañas */}
        <Col xs={24} lg={16}>
          <Card>
            <Tabs defaultActiveKey="mi-perfil">
              {/* Pestaña de Mi Perfil */}
              <TabPane 
                tab={
                  <span>
                    <UserOutlined />
                    Mi Perfil
                  </span>
                } 
                key="mi-perfil"
              >
                <Title level={3}>
                  Editar Información del Perfil
                </Title>
                
                <Alert
                  message="Información importante"
                  description="Los cambios en el perfil se aplicarán inmediatamente. Si cambia su contraseña, asegúrese de recordarla para futuros inicios de sesión."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  size="large"
                >
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Nombre"
                        name="nombre"
                        rules={[
                          { required: true, message: 'Por favor ingrese su nombre' },
                          { min: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                        ]}
                      >
                        <Input 
                          prefix={<UserOutlined />}
                          placeholder="Su nombre"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Apellido Paterno"
                        name="apellidoPaterno"
                        rules={[
                          { required: true, message: 'Por favor ingrese su apellido paterno' },
                          { min: 2, message: 'El apellido debe tener al menos 2 caracteres' }
                        ]}
                      >
                        <Input 
                          prefix={<UserOutlined />}
                          placeholder="Apellido paterno"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Apellido Materno"
                        name="apellidoMaterno"
                        rules={[
                          { required: true, message: 'Por favor ingrese su apellido materno' },
                          { min: 2, message: 'El apellido debe tener al menos 2 caracteres' }
                        ]}
                      >
                        <Input 
                          prefix={<UserOutlined />}
                          placeholder="Apellido materno"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Nombre de Usuario"
                      >
                        <Input 
                          value={datosUsuario?.nombreUsuario}
                          disabled
                          prefix={<UserOutlined />}
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          El nombre de usuario no se puede modificar
                        </Text>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Tipo de Acceso"
                        name="acceso"
                        rules={[{ required: true, message: 'Por favor seleccione el tipo de acceso' }]}
                      >
                        <Select placeholder="Seleccione el acceso">
                          {tiposAcceso.map((acceso) => (
                            <Option key={acceso.codigoAcceso} value={acceso.codigoAcceso}>
                              {acceso.codigoAcceso} - {acceso.nombre}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider>
                    <SafetyOutlined /> Cambiar Contraseña
                  </Divider>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        label="Nueva Contraseña"
                        name="nuevaContrasena"
                        rules={[
                          { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Dejar en blanco para no cambiar"
                        />
                      </Form.Item>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Si no desea cambiar la contraseña, deje este campo en blanco
                      </Text>
                    </Col>
                  </Row>

                  <Form.Item style={{ marginTop: 32 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                      size="large"
                      block
                    >
                      {loading ? 'Actualizando...' : 'Actualizar Perfil'}
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              {/* Pestaña de Gestión de Usuarios */}
              <TabPane 
                tab={
                  <span>
                    <UserOutlined />
                    Gestión de Usuarios
                  </span>
                } 
                key="gestion-usuarios"
              >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={3} style={{ margin: 0 }}>
                    Gestión de Usuarios del Sistema
                  </Title>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalNuevoUsuario(true)}
                  >
                    Nuevo Usuario
                  </Button>
                </div>

                <Alert
                  message="Administración de usuarios"
                  description="Desde aquí puede gestionar todos los usuarios del sistema. Solo los administradores pueden crear y eliminar usuarios."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Table
                  columns={columnasUsuarios}
                  dataSource={usuarios}
                  rowKey="nombreUsuario"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Modal para crear nuevo usuario */}
      <Modal
        title={
          <span>
            <PlusOutlined /> Crear Nuevo Usuario
          </span>
        }
        open={modalNuevoUsuario}
        onCancel={() => {
          setModalNuevoUsuario(false);
          formNuevoUsuario.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="Información importante"
          description="Todos los campos son obligatorios. El nombre de usuario debe ser único en el sistema."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={formNuevoUsuario}
          layout="vertical"
          onFinish={onFinishNuevoUsuario}
          size="large"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Nombre de Usuario"
                name="user"
                rules={[
                  { required: true, message: 'Por favor ingrese el nombre de usuario' },
                  { min: 3, message: 'El usuario debe tener al menos 3 caracteres' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Nombre de usuario"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Contraseña"
                name="passwordPlano"
                rules={[
                  { required: true, message: 'Por favor ingrese la contraseña' },
                  { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Contraseña"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Nombre"
                name="nombre"
                rules={[
                  { required: true, message: 'Por favor ingrese el nombre' },
                  { min: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Nombre"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Apellido Paterno"
                name="apellidoPaterno"
                rules={[
                  { required: true, message: 'Por favor ingrese el apellido paterno' },
                  { min: 2, message: 'El apellido debe tener al menos 2 caracteres' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Apellido paterno"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Apellido Materno"
                name="apellidoMaterno"
                rules={[
                  { required: true, message: 'Por favor ingrese el apellido materno' },
                  { min: 2, message: 'El apellido debe tener al menos 2 caracteres' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Apellido materno"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Tipo de Acceso"
            name="acceso"
            rules={[{ required: true, message: 'Por favor seleccione el tipo de acceso' }]}
          >
            <Select placeholder="Seleccione el acceso">
              {tiposAcceso.map((acceso) => (
                <Option key={acceso.codigoAcceso} value={acceso.codigoAcceso}>
                  {acceso.codigoAcceso} - {acceso.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 32, textAlign: 'right' }}>
            <Button 
              style={{ marginRight: 8 }}
              onClick={() => {
                setModalNuevoUsuario(false);
                formNuevoUsuario.resetFields();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creandoUsuario}
              icon={<PlusOutlined />}
            >
              {creandoUsuario ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PerfilUsuario;