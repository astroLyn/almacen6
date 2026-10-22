import React, { useState, useEffect } from "react";
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
  Select,
  Tabs,
  Table,
  Modal,
  Popconfirm,
  Grid,
  Empty,
} from "antd";
import {
  UserOutlined,
  SaveOutlined,
  LockOutlined,
  SafetyOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axiosConfig";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const PerfilUsuario = () => {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const [form] = Form.useForm();
  const [formNuevoUsuario] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.nombreUsuario) return;

      try {
        setCargandoDatos(true);
        const resPerfil = await api.get(
          `/auth/usuarios/${user.nombreUsuario}`
        );
        setDatosUsuario(resPerfil.data);
        form.setFieldsValue(resPerfil.data);

        if (user.acceso === "ENC") {
          const resLista = await api.get("/auth/usuarios");
          setUsuarios(resLista.data);
        }
      } catch (error) {
        console.error("❌ Error:", error);
        message.error("Error al sincronizar datos del servidor");
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarDatos();
  }, [user, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        nombre: values.nombre,
        apellidoPaterno: values.apellidoPaterno,
        apellidoMaterno: values.apellidoMaterno,
        nuevoPasswordPlano: values.nuevaContrasena || null,
      };

      if (!values.nuevaContrasena) delete payload.nuevoPasswordPlano;

      await api.put(`/auth/usuarios/${user.nombreUsuario}`, payload);
      message.success("Perfil actualizado correctamente");

      setDatosUsuario({ ...datosUsuario, ...payload });
    } catch (error) {
      message.error(
        error.response?.data?.detalle || "Error al actualizar perfil"
      );
    } finally {
      setLoading(false);
    }
  };

  const onFinishNuevoUsuario = async (values) => {
    setCreandoUsuario(true);
    try {
      await api.post("/auth/usuarios", values);
      message.success("✅ Nuevo usuario registrado con éxito");
      setModalNuevoUsuario(false);
      formNuevoUsuario.resetFields();

      const resLista = await api.get("/auth/usuarios");
      setUsuarios(resLista.data);
    } catch (error) {
      message.error(error.response?.data?.detalle || "Error al crear usuario");
    } finally {
      setCreandoUsuario(false);
    }
  };

  const eliminarUsuario = async (nombreUsuario) => {
    try {
      await api.delete(`/auth/usuarios/${nombreUsuario}`);
      message.success("Usuario eliminado");
      setUsuarios(usuarios.filter((u) => u.nombreUsuario !== nombreUsuario));
    } catch (error) {
      message.error("No se pudo eliminar al usuario");
    }
  };

  const obtenerColorRol = (acceso) => {
    const colores = { ENC: "purple", EMP: "blue", CON: "cyan" };
    return colores[acceso] || "default";
  };

  const obtenerNombreRol = (acceso) => {
    const nombres = {
      ENC: "Encargada (Admin)",
      EMP: "Empleado (Operador)",
      CON: "Consultante (Lectura)",
    };
    return nombres[acceso] || "Usuario";
  };

  const obtenerNombreRolCorto = (acceso) => {
    const nombres = { ENC: "Encargada", EMP: "Empleado", CON: "Consultante" };
    return nombres[acceso] || "Usuario";
  };

  const columnasUsuarios = [
    {
      title: "Usuario",
      dataIndex: "nombreUsuario",
      key: "nombreUsuario",
      render: (text) => <Text strong>@{text}</Text>,
    },
    {
      title: "Nombre Completo",
      key: "nombreCompleto",
      render: (_, r) =>
        `${r.nombre} ${r.apellidoPaterno} ${r.apellidoMaterno || ""}`,
    },
    {
      title: "Rol",
      dataIndex: "acceso",
      key: "acceso",
      render: (acc) => (
        <Tag color={obtenerColorRol(acc)}>{obtenerNombreRol(acc)}</Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space>
          {record.nombreUsuario !== user?.nombreUsuario ? (
            <Popconfirm
              title="¿Eliminar usuario?"
              onConfirm={() => eliminarUsuario(record.nombreUsuario)}
              okText="Eliminar"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Borrar
              </Button>
            </Popconfirm>
          ) : (
            <Tag>Tú</Tag>
          )}
        </Space>
      ),
    },
  ];

  // 🎴 Card móvil de usuario
  const renderUsuarioCard = (u) => {
    const esMismoUsuario = u.nombreUsuario === user?.nombreUsuario;
    const nombreCompleto = `${u.nombre} ${u.apellidoPaterno} ${
      u.apellidoMaterno || ""
    }`.trim();

    return (
      <div
        key={u.nombreUsuario}
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: 10,
          padding: 12,
          marginBottom: 10,
          background: "#fff",
        }}
      >
        {/* Header: avatar + nombre + tag rol */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <Avatar
            size={36}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1677ff", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={nombreCompleto}
            >
              {nombreCompleto}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              @{u.nombreUsuario}
            </div>
          </div>
          {esMismoUsuario && (
            <Tag color="blue" style={{ margin: 0, flexShrink: 0 }}>
              Tú
            </Tag>
          )}
        </div>

        {/* Rol */}
        <div style={{ marginBottom: 10 }}>
          <Tag color={obtenerColorRol(u.acceso)} style={{ margin: 0 }}>
            {obtenerNombreRol(u.acceso)}
          </Tag>
        </div>

        {/* Acciones */}
        {!esMismoUsuario && (
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
            <Popconfirm
              title="¿Eliminar usuario?"
              description={`Se eliminará a @${u.nombreUsuario}`}
              onConfirm={() => eliminarUsuario(u.nombreUsuario)}
              okText="Eliminar"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button type="default" danger icon={<DeleteOutlined />} block>
                Eliminar Usuario
              </Button>
            </Popconfirm>
          </div>
        )}
      </div>
    );
  };

  if (cargandoDatos)
    return (
      <Card
        loading
        title="Cargando perfil..."
        style={{ margin: isMobile ? 12 : 24 }}
      />
    );

  return (
    <div
      style={{
        padding: isMobile ? "12px 8px" : "24px 16px",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <Row gutter={isMobile ? [12, 12] : [24, 24]}>
        {/* CARD DE PERFIL */}
        <Col xs={24} lg={8}>
          <Card
            hoverable
            style={{ textAlign: "center", borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Avatar
              size={isMobile ? 80 : 100}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#1677ff" }}
            />
            <Title
              level={3}
              style={{
                marginTop: isMobile ? 12 : 16,
                marginBottom: 8,
                fontSize: isMobile ? 18 : 24,
              }}
            >
              {datosUsuario?.nombre} {datosUsuario?.apellidoPaterno}
            </Title>
            <Tag color={obtenerColorRol(datosUsuario?.acceso)}>
              {obtenerNombreRol(datosUsuario?.acceso)}
            </Tag>
            <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />
            <div style={{ textAlign: "left" }}>
              <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                ID de Usuario:
              </Text>{" "}
              <br />
              <Text
                strong
                style={{ fontSize: isMobile ? 14 : 16 }}
              >
                @{datosUsuario?.nombreUsuario}
              </Text>
            </div>
          </Card>
        </Col>

        {/* TABS: PERFIL / GESTIÓN */}
        <Col xs={24} lg={16}>
          <Card
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <Tabs defaultActiveKey="1" size={isMobile ? "small" : "middle"}>
              <TabPane
                tab={
                  <span>
                    <UserOutlined /> Mi Perfil
                  </span>
                }
                key="1"
              >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Nombre"
                        name="nombre"
                        rules={[{ required: true }]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Apellido Paterno"
                        name="apellidoPaterno"
                        rules={[{ required: true }]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Apellido Materno"
                        name="apellidoMaterno"
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    label="Cambiar Contraseña"
                    name="nuevaContrasena"
                  >
                    <Input.Password
                      placeholder="Dejar en blanco para mantener actual"
                      prefix={<LockOutlined />}
                      size="large"
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                    block
                  >
                    Guardar Cambios
                  </Button>
                </Form>
              </TabPane>

              {user?.acceso === "ENC" && (
                <TabPane
                  tab={
                    <span>
                      <SafetyOutlined /> Gestión de Usuarios
                    </span>
                  }
                  key="2"
                >
                  {/* Header responsive del tab */}
                  {isMobile ? (
                    <div style={{ marginBottom: 12 }}>
                      <Title
                        level={4}
                        style={{ margin: "0 0 8px 0", fontSize: 16 }}
                      >
                        Usuarios del Almacén
                      </Title>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalNuevoUsuario(true)}
                        block
                        size="large"
                      >
                        Nuevo Usuario
                      </Button>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginBottom: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <Title level={4} style={{ margin: 0 }}>
                        Usuarios del Almacén
                      </Title>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalNuevoUsuario(true)}
                      >
                        Nuevo Usuario
                      </Button>
                    </div>
                  )}

                  {/* Listado */}
                  {isMobile ? (
                    usuarios.length === 0 ? (
                      <Empty description="Sin usuarios registrados" />
                    ) : (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#888",
                            marginBottom: 8,
                          }}
                        >
                          {usuarios.length} usuario(s) registrado(s)
                        </div>
                        {usuarios.map(renderUsuarioCard)}
                      </div>
                    )
                  ) : (
                    <Table
                      columns={columnasUsuarios}
                      dataSource={usuarios}
                      rowKey="nombreUsuario"
                      size="small"
                      scroll={{ x: 600 }}
                    />
                  )}
                </TabPane>
              )}
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* MODAL NUEVO USUARIO */}
      <Modal
        title="Registrar Nuevo Personal"
        open={modalNuevoUsuario}
        onCancel={() => setModalNuevoUsuario(false)}
        footer={null}
        destroyOnClose
        width={isMobile ? "95%" : 520}
        style={{ top: isMobile ? 16 : 100 }}
      >
        <Form
          form={formNuevoUsuario}
          layout="vertical"
          onFinish={onFinishNuevoUsuario}
        >
          <Form.Item
            label="Usuario (Login)"
            name="user"
            rules={[{ required: true }]}
          >
            <Input
              prefix={<UserOutlined />}
              size="large"
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            label="Contraseña Inicial"
            name="passwordPlano"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Row gutter={8}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Nombre"
                name="nombre"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Apellido"
                name="apellidoPaterno"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Rol del Sistema"
            name="acceso"
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Option value="ENC">Encargada (Acceso Total)</Option>
              <Option value="EMP">Empleado (Operación)</Option>
              <Option value="CON">Consultante (Solo Lectura)</Option>
            </Select>
          </Form.Item>
          <Button
            type="primary"
            block
            htmlType="submit"
            loading={creandoUsuario}
            size="large"
          >
            Registrar Usuario
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default PerfilUsuario;