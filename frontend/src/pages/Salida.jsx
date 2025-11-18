import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import {
  Card,
  Input,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Form,
  Row,
  Col,
  Statistic,
  Descriptions,
  message,
  DatePicker,
  Switch,
  Modal,
  Badge,
  Select
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function SalidaMaterial() {
  const [materiales, setMateriales] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [salidasPendientes, setSalidasPendientes] = useState([]);
  const [loadingSalidas, setLoadingSalidas] = useState(false);
  const [alertarSalida, setAlertarSalida] = useState(false);

  // Campos del formulario
  const [OS, setOS] = useState("");
  const [fecha, setFecha] = useState(dayjs());
  const [cotizacion, setCotizacion] = useState("");
  const [cliente, setCliente] = useState("");
  const [materialApartado, setMaterialApartado] = useState(null);
  const [listaMaterialApartado, setListaMaterialApartado] = useState([]);

  // Estados para clientes
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // 📦 Cargar datos iniciales (clientes)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCargandoClientes(true);
        const clientesRes = await api.get("/clientes");
        setClientes(clientesRes.data);
      } catch (error) {
        console.error("❌ Error al cargar clientes:", error);
        message.error("Error al cargar la lista de clientes");
      } finally {
        setCargandoClientes(false);
      }
    };
    fetchData();
  }, []);

// 🟢 Agregar nuevo cliente - SIMPLIFICADO
const agregarNuevoCliente = async () => {
  if (!nuevoCliente.trim()) {
    message.warning("Escribe un nombre para el nuevo cliente");
    return;
  }

  try {
    setCargandoClientes(true);
    const res = await api.post("/clientes", { 
      nombre: nuevoCliente.trim(),
      nombreFiscal: nuevoCliente.trim(),
      rfc: "",
      direccion: "",
      telefono: "",
      email: ""
    });
    
    // El backend ahora retorna el cliente creado directamente
    const clienteCreado = res.data;
    
    setClientes(prev => [...prev, clienteCreado]);
    setCliente(clienteCreado.claveCliente);
    message.success("Cliente agregado correctamente");
    setNuevoCliente("");
  } catch (error) {
    console.error("❌ Error al agregar cliente:", error);
    if (error.response?.data) {
      message.error(error.response.data.detalle || error.response.data.message || "No se pudo agregar el cliente");
    } else {
      message.error("Error de conexión al agregar cliente");
    }
  } finally {
    setCargandoClientes(false);
  }
};

  // 🔍 Cargar salidas pendientes
  const cargarSalidasPendientes = async () => {
    setLoadingSalidas(true);
    try {
      const { data } = await api.get("/salidas/pendientes");
      setSalidasPendientes(data);
    } catch (error) {
      console.error("❌ Error al obtener salidas pendientes:", error);
      message.error("Error al cargar salidas pendientes");
    } finally {
      setLoadingSalidas(false);
    }
  };

  // ✅ Aprobar salida
  const aprobarSalida = async (noSalida) => {
    try {
      await api.put(`/salidas/${noSalida}/aprobar`);
      message.success(`✅ Salida #${noSalida} aprobada correctamente`);
      cargarSalidasPendientes();
    } catch (error) {
      console.error("❌ Error al aprobar salida:", error);
      message.error(error.response?.data?.error || "Error al aprobar salida");
    }
  };

  // 🔍 Buscar material
  const buscarMaterial = async () => {
    if (!busqueda.trim()) {
      message.warning("Ingrese un término de búsqueda");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`/salidas/material/buscar?search=${busqueda}`);
      if (data.length === 0) {
        message.warning("No se encontró ningún material con ese término");
        setMaterialSeleccionado(null);
        return;
      }
      setMaterialSeleccionado(data[0]);
      message.success("Material encontrado");
    } catch (error) {
      console.error("❌ Error al buscar material:", error);
      message.error("Error al buscar material");
      setMaterialSeleccionado(null);
    } finally {
      setLoading(false);
    }
  };

  // ➕ Agregar material
  const agregarMaterial = () => {
    if (!materialSeleccionado || !cantidad) {
      message.warning("Seleccione un material e ingrese la cantidad");
      return;
    }

    const existe = materiales.find(
      (m) => m.codigoMaterial === materialSeleccionado.codigoMaterial
    );
    if (existe) {
      message.warning("Este material ya fue agregado");
      return;
    }

    setMateriales([
      ...materiales,
      {
        ...materialSeleccionado,
        cantidad: parseFloat(cantidad),
        key: materialSeleccionado.codigoMaterial
      },
    ]);

    message.success("Material agregado a la lista");
    setCantidad("");
    setMaterialSeleccionado(null);
  };

  // 🗑️ Eliminar material
  const eliminarMaterial = (codigo) => {
    setMateriales(materiales.filter((m) => m.codigoMaterial !== codigo));
    message.success("Material removido de la lista");
  };

  // 📦 Registrar salida
  const registrarSalida = async () => {
    if (!OS || !fecha || !cotizacion || materiales.length === 0) {
      message.warning("Faltan datos requeridos o no hay materiales agregados");
      return;
    }

    const payload = {
      OS,
      fecha: fecha.format("YYYY-MM-DD"),
      cotizacion,
      cliente: cliente || null,
      materialApartado: materialApartado || null,
      materiales: materiales.map((m) => ({
        codigoMaterial: m.codigoMaterial,
        cantidad: m.cantidad,
      })),
    };

    try {
      setLoading(true);
      const { data } = await api.post("/salidas", payload);
      message.success(`✅ Salida registrada correctamente (No. ${data.noSalida})`);

      if (alertarSalida) {
        message.info("🔔 Alerta de salida activada - Se notificará al personal correspondiente");
      }

      limpiarFormulario();
    } catch (error) {
      console.error("❌ Error al registrar salida:", error);
      message.error(error.response?.data?.error || "Error al registrar salida");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setOS("");
    setFecha(dayjs());
    setCotizacion("");
    setCliente("");
    setMaterialApartado(null);
    setMateriales([]);
    setMaterialSeleccionado(null);
    setBusqueda("");
    setCantidad("");
    setAlertarSalida(false);
    message.info("Formulario limpiado");
  };

  const limpiarBusqueda = () => {
    setMaterialSeleccionado(null);
    setBusqueda("");
    setCantidad("");
  };

  const abrirModalSalidas = () => {
    setModalVisible(true);
    cargarSalidasPendientes();
  };

// Columnas tabla salidas pendientes
const columnasSalidas = [
  {
    title: "N° Salida",
    dataIndex: "noSalida",
    key: "noSalida",
    width: 100,
  },
  {
    title: "OS",
    dataIndex: "OS",
    key: "OS",
    width: 120,
  },
  {
    title: "Fecha",
    dataIndex: "fecha",
    key: "fecha",
    render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : "-",
    width: 120,
  },
  {
    title: "Cotización",
    dataIndex: "cotizacion",
    key: "cotizacion",
    width: 150,
    render: (cotizacion) => cotizacion || "-",
  },
  {
    title: "Cliente",
    dataIndex: "cliente",
    key: "cliente",
    width: 200,
    render: (clienteId) => {
      if (!clienteId) return "-";
      const clienteEncontrado = clientes.find(c => c.claveCliente === clienteId);
      return clienteEncontrado 
        ? (clienteEncontrado.nombre || clienteEncontrado.nombreFiscal || `Cliente ${clienteId}`)
        : ` ${clienteId}`;
    },
  },
  {
    title: "Materiales",
    dataIndex: "totalMateriales",
    key: "totalMateriales",
    width: 120,
    render: (total) => total ? <Tag color="blue">{total} materiales</Tag> : "-",
  },
  {
    title: "Acción",
    key: "accion",
    width: 120,
    render: (_, record) => (
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        onClick={() => aprobarSalida(record.noSalida)}
        size="small"
      >
        Aprobar
      </Button>
    ),
  },
];

<Modal
  title={
    <Space>
      <ClockCircleOutlined />
      <span>Salidas por Aprobar</span>
      <Tag color="orange">{salidasPendientes.length} pendientes</Tag>
    </Space>
  }
  open={modalVisible}
  onCancel={() => setModalVisible(false)}
  footer={[
    <Button key="close" onClick={() => setModalVisible(false)}>
      Cerrar
    </Button>,
  ]}
  width={1000} // Más ancho para mejor visualización
>
  <Table
    dataSource={salidasPendientes}
    columns={columnasSalidas}
    loading={loadingSalidas}
    pagination={{ pageSize: 5 }}
    size="middle"
    scroll={{ x: 900 }}
    locale={{
      emptyText: (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <CheckCircleOutlined style={{ fontSize: "32px", color: "#52c41a" }} />
          <br />
          <Text>No hay salidas pendientes de aprobación</Text>
        </div>
      ),
    }}
  />
</Modal>

  // Columnas tabla materiales
  const columnas = [
    {
      title: "Código",
      dataIndex: "codigoMaterial",
      key: "codigoMaterial",
      width: 120,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 100,
      render: (cantidad) => <Tag color="blue">{cantidad} unidades</Tag>,
    },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      width: 100,
      render: (ubicacion) => <Tag color="green">{ubicacion}</Tag>,
    },
    {
      title: "Stock Actual",
      dataIndex: "stockActual",
      key: "stockActual",
      width: 100,
      render: (stock) => <Text strong>{stock}</Text>,
    },
    {
      title: "Acción",
      key: "accion",
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => eliminarMaterial(record.codigoMaterial)}
        >
          Eliminar
        </Button>
      ),
    },
  ];

return (
  <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
    <Card
      style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      bodyStyle={{ padding: "32px" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#fa8c16" }}>
            <ShoppingCartOutlined style={{ marginRight: "12px" }} />
            Salida de Materiales
          </Title>
          <Text type="secondary">
            Registra la salida de materiales del almacén
          </Text>
        </div>

        <Badge count={salidasPendientes.length} size="small" offset={[-10, 10]}>
          <Button
            type="default"
            icon={<ClockCircleOutlined />}
            onClick={abrirModalSalidas}
            size="large"
          >
            Salidas por Aprobar
          </Button>
        </Badge>
      </div>

      <Card
        title="Datos de la Salida"
        style={{ marginBottom: "24px" }}
        extra={
          <Space>
            <Text>Alertar salida</Text>
            <Switch
              checked={alertarSalida}
              onChange={setAlertarSalida}
              checkedChildren="Sí"
              unCheckedChildren="No"
            />
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="N° OS" required>
              <Input
                placeholder="Número de OS"
                value={OS}
                onChange={(e) => setOS(e.target.value)}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Fecha" required>
              <DatePicker
                value={fecha}
                onChange={setFecha}
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Cotización" required>
              <Input
                placeholder="Número de cotización"
                value={cotizacion}
                onChange={(e) => setCotizacion(e.target.value)}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Cliente">
              <Select
                showSearch
                placeholder="Escribe o selecciona un cliente"
                value={cliente}
                onChange={setCliente}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space.Compact style={{ width: "100%", padding: "0 8px 4px" }}>
                      <Input
                        placeholder="Nuevo cliente"
                        value={nuevoCliente}
                        onChange={(e) => setNuevoCliente(e.target.value)}
                        onPressEnter={agregarNuevoCliente}
                        size="middle"
                      />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={agregarNuevoCliente}
                        loading={cargandoClientes}
                      >
                        Agregar
                      </Button>
                    </Space.Compact>
                  </>
                )}
                loading={cargandoClientes}
                size="large"
                style={{ width: "100%" }}
              >
                {clientes.map((cliente) => (
                  <Option key={cliente.claveCliente} value={cliente.claveCliente}>
                    {cliente.nombre || cliente.nombreFiscal || `Cliente ${cliente.claveCliente}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Búsqueda de material */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="Buscar Material"
            extra={
              materialSeleccionado && (
                <Button type="text" onClick={limpiarBusqueda}>
                  Limpiar Búsqueda
                </Button>
              )
            }
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="Buscar por código o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onPressEnter={buscarMaterial}
                size="large"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={buscarMaterial}
                loading={loading}
                size="large"
              >
                Buscar
              </Button>
            </Space.Compact>
          </Card>
        </Col>

        <Col span={12}>
          {materialSeleccionado && (
            <Card
              title="Material Seleccionado"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={agregarMaterial}
                  disabled={!cantidad}
                  size="large"
                >
                  Agregar
                </Button>
              }
            >
              <div style={{ marginBottom: "16px" }}>
                <Text strong style={{ fontSize: "16px" }}>
                  {materialSeleccionado.codigoMaterial} - {materialSeleccionado.descripcion}
                </Text>
              </div>

              <Descriptions size="small" bordered column={2}>
                <Descriptions.Item label="Stock Actual" span={1}>
                  <Statistic value={materialSeleccionado.stockActual} valueStyle={{ fontSize: "14px" }} />
                </Descriptions.Item>
                <Descriptions.Item label="Ubicación" span={1}>
                  <Tag color="blue" style={{ fontSize: "14px", padding: "4px 8px" }}>
                    <strong>{materialSeleccionado.ubicacion}</strong>
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Form.Item label="Cantidad a Retirar *" style={{ marginBottom: 0 }}>
                <Input
                  type="number"
                  placeholder="Ingresa la cantidad"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Card>
          )}
        </Col>
      </Row>

      {/* Tabla de materiales */}
      <Row>
        <Col span={24}>
          <Card
            title={
              <Space>
                <Text>Materiales a Retirar</Text>
                <Tag color="blue" style={{ fontSize: "14px" }}>
                  {materiales.length} material(es)
                </Tag>
              </Space>
            }
            extra={
              <Space>
                <Button onClick={limpiarFormulario} danger size="large">
                  Limpiar Todo
                </Button>
                <Button
                  type="primary"
                  onClick={registrarSalida}
                  loading={loading}
                  disabled={materiales.length === 0}
                  size="large"
                  icon={<ExclamationCircleOutlined />}
                >
                  Registrar Salida
                </Button>
              </Space>
            }
          >
            {materiales.length > 0 ? (
              <Table
                dataSource={materiales}
                columns={columnas}
                pagination={false}
                size="middle"
                scroll={{ x: 800 }}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Total de materiales: {materiales.length}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>
                          Total unidades: {materiales.reduce((sum, m) => sum + m.cantidad, 0)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={3}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <ShoppingCartOutlined style={{ fontSize: "48px", color: "#d9d9d9", marginBottom: "16px" }} />
                <br />
                <Text type="secondary" style={{ fontSize: "16px" }}>
                  No hay materiales agregados. Busca y agrega materiales para registrar una salida.
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Card>

    {/* Modal de salidas pendientes */}
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Salidas por Aprobar</span>
          <Tag color="orange">{salidasPendientes.length} pendientes</Tag>
        </Space>
      }
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setModalVisible(false)}>
          Cerrar
        </Button>,
      ]}
      width={1000} // Más ancho para mejor visualización
    >
      <Table
        dataSource={salidasPendientes}
        columns={columnasSalidas}
        loading={loadingSalidas}
        pagination={{ pageSize: 5 }}
        size="middle"
        scroll={{ x: 900 }}
        locale={{
          emptyText: (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <CheckCircleOutlined style={{ fontSize: "32px", color: "#52c41a" }} />
              <br />
              <Text>No hay salidas pendientes de aprobación</Text>
            </div>
          ),
        }}
      />
    </Modal>
  </div>
);
}