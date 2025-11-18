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
const { TextArea } = Input;

export default function EntradaMaterial() {
  const [materiales, setMateriales] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [entradasPendientes, setEntradasPendientes] = useState([]);
  const [loadingEntradas, setLoadingEntradas] = useState(false);
  const [alertarEntrada, setAlertarEntrada] = useState(false);

  // Campos del formulario
  const [OS, setOS] = useState("");
  const [fecha, setFecha] = useState(dayjs());
  const [proveedor, setProveedor] = useState("");
  const [cliente, setCliente] = useState("");

  // Estados para clientes y proveedores
  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);

  // 📦 Cargar datos iniciales (clientes y proveedores)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCargandoClientes(true);
        setCargandoProveedores(true);
        
        const [clientesRes, proveedoresRes] = await Promise.all([
          api.get("/clientes"),
          api.get("/proveedores")
        ]);
        
        setClientes(clientesRes.data);
        setProveedores(proveedoresRes.data);
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        message.error("Error al cargar la lista de clientes o proveedores");
      } finally {
        setCargandoClientes(false);
        setCargandoProveedores(false);
      }
    };
    fetchData();
  }, []);

  // 🟢 Agregar nuevo cliente
  const agregarNuevoCliente = async () => {
    if (!nuevoCliente.trim()) {
      message.warning("Escribe un nombre para el nuevo cliente");
      return;
    }

    try {
      setCargandoClientes(true);
      const res = await api.post("/clientes", { 
        nombreFiscal: nuevoCliente.trim()
      });
      
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

  // 🟢 Agregar nuevo proveedor
  const agregarNuevoProveedor = async () => {
    if (!nuevoProveedor.trim()) {
      message.warning("Escribe un nombre para el nuevo proveedor");
      return;
    }

    try {
      setCargandoProveedores(true);
      
      // Usar el backend existente que solo retorna mensaje de éxito
      await api.post("/proveedores", { 
        nombre: nuevoProveedor.trim()
      });
      
      message.success("Proveedor agregado correctamente");
      
      // Recargar la lista de proveedores para obtener el nuevo
      const proveedoresRes = await api.get("/proveedores");
      setProveedores(proveedoresRes.data);
      
      // Buscar el proveedor recién creado por nombre y seleccionarlo
      const proveedorCreado = proveedoresRes.data.find(
        p => p.nombre === nuevoProveedor.trim()
      );
      
      if (proveedorCreado) {
        setProveedor(proveedorCreado.codigo);
      }
      
      setNuevoProveedor("");
    } catch (error) {
      console.error("❌ Error al agregar proveedor:", error);
      if (error.response?.data) {
        message.error(error.response.data.message || "No se pudo agregar el proveedor");
      } else {
        message.error("Error de conexión al agregar proveedor");
      }
    } finally {
      setCargandoProveedores(false);
    }
  };

  // 🔍 Cargar entradas pendientes
  const cargarEntradasPendientes = async () => {
    setLoadingEntradas(true);
    try {
      const { data } = await api.get("/entradas/pendientes");
      setEntradasPendientes(data);
    } catch (error) {
      console.error("❌ Error al obtener entradas pendientes:", error);
      message.error("Error al cargar entradas pendientes");
    } finally {
      setLoadingEntradas(false);
    }
  };

  // ✅ Aprobar entrada
  const aprobarEntrada = async (noEntrada) => {
    try {
      await api.put(`/entradas/${noEntrada}/aprobar`);
      message.success(`✅ Entrada #${noEntrada} aprobada correctamente`);
      cargarEntradasPendientes();
    } catch (error) {
      console.error("❌ Error al aprobar entrada:", error);
      message.error(error.response?.data?.error || "Error al aprobar entrada");
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
      const { data } = await api.get(`/entradas/materiales/buscar?search=${busqueda}`);
      
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

  // ➕ Agregar material a la lista
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

  // 🗑️ Eliminar material de la lista
  const eliminarMaterial = (codigo) => {
    setMateriales(materiales.filter((m) => m.codigoMaterial !== codigo));
    message.success("Material removido de la lista");
  };

  // 📦 Registrar entrada
  const registrarEntrada = async () => {
    if (!OS || !fecha || !proveedor || materiales.length === 0) {
      message.warning("Faltan datos requeridos o no hay materiales agregados");
      return;
    }

    const payload = {
      OS,
      fecha: fecha.format('YYYY-MM-DD'),
      proveedor,
      cliente: cliente || null,
      materiales: materiales.map((m) => ({
        codigoMaterial: m.codigoMaterial,
        cantidad: m.cantidad,
      })),
    };

    try {
      setLoading(true);
      const { data } = await api.post("/entradas", payload);
      message.success(`✅ Entrada registrada correctamente (No. ${data.noEntrada})`);
      
      if (alertarEntrada) {
        message.info("🔔 Alerta de entrada activada - Se notificará al personal correspondiente");
      }
      
      limpiarFormulario();
    } catch (error) {
      console.error("❌ Error al registrar entrada:", error);
      message.error(error.response?.data?.error || "Error al registrar entrada");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setOS("");
    setFecha(dayjs());
    setProveedor("");
    setCliente("");
    setMateriales([]);
    setMaterialSeleccionado(null);
    setBusqueda("");
    setCantidad("");
    setAlertarEntrada(false);
    message.info("Formulario limpiado");
  };

  const limpiarBusqueda = () => {
    setMaterialSeleccionado(null);
    setBusqueda("");
    setCantidad("");
  };

  const abrirModalEntradas = () => {
    setModalVisible(true);
    cargarEntradasPendientes();
  };

  // Columnas para la tabla de entradas pendientes
  const columnasEntradas = [
    {
      title: "N° Entrada",
      dataIndex: "noEntrada",
      key: "noEntrada",
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
      width: 120,
      render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : "-",
    },
    // Prueba esta versión que maneja diferentes tipos
{
  title: "Proveedor",
  dataIndex: "proveedorId", // CAMBIADO: de "proveedor" a "proveedorId"
  key: "proveedorId",
  width: 200,
  render: (proveedorId) => {
    if (!proveedorId) return "-";
    const proveedorEncontrado = proveedores.find(p => p.codigo === proveedorId);
    return proveedorEncontrado 
      ? proveedorEncontrado.nombre
      : `Proveedor ${proveedorId}`;
  },
},
    {
    title: "Cliente",
    dataIndex: "cliente",
    key: "cliente",
    width: 200, // Más ancho para mejor visualización
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
          onClick={() => aprobarEntrada(record.noEntrada)}
          size="small"
        >
          Aprobar
        </Button>
      ),
    },
  ];

  // Columnas para la tabla de materiales
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
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card 
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        bodyStyle={{ padding: '32px' }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '32px' 
        }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <ShoppingCartOutlined style={{ marginRight: '12px' }} />
              Entrada de Materiales
            </Title>
            <Text type="secondary">
              Registra la entrada de materiales al almacén
            </Text>
          </div>
          
          <Badge count={entradasPendientes.length} size="small" offset={[-10, 10]}>
            <Button 
              type="default"
              icon={<ClockCircleOutlined />}
              onClick={abrirModalEntradas}
              size="large"
            >
              Entradas por Aprobar
            </Button>
          </Badge>
        </div>

        {/* Datos de la Entrada */}
        <Card 
          title="Datos de la Entrada" 
          style={{ marginBottom: '24px' }}
          extra={
            <Space>
              <Text>Alertar entrada</Text>
              <Switch
                checked={alertarEntrada}
                onChange={setAlertarEntrada}
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
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  size="large"
                />
              </Form.Item>
            </Col>
            {/* PROVEEDOR */}
            <Col span={6}>
              <Form.Item label="Proveedor" required>
                <Select
                  showSearch
                  placeholder="Escribe o selecciona un proveedor"
                  value={proveedor}
                  onChange={setProveedor}
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
                          placeholder="Nuevo proveedor"
                          value={nuevoProveedor}
                          onChange={(e) => setNuevoProveedor(e.target.value)}
                          onPressEnter={agregarNuevoProveedor}
                          size="middle"
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={agregarNuevoProveedor}
                          loading={cargandoProveedores}
                        >
                          Agregar
                        </Button>
                      </Space.Compact>
                    </>
                  )}
                  loading={cargandoProveedores}
                  size="large"
                  style={{ width: "100%" }}
                >
                  {proveedores.map((proveedor) => (
                    <Option key={proveedor.codigo} value={proveedor.codigo}>
                      {proveedor.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* CLIENTE */}
            <Col span={6}>
              <Form.Item label="Cliente (opcional)">
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
                      {cliente.nombreFiscal || `Cliente ${cliente.claveCliente}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Búsqueda y Material Seleccionado */}
        <Row gutter={16}>
          <Col span={12}>
            <Card 
              title="Buscar Material" 
              style={{ marginBottom: '24px' }}
              extra={
                materialSeleccionado && (
                  <Button type="text" onClick={limpiarBusqueda}>
                    Limpiar Búsqueda
                  </Button>
                )
              }
            >
              <Space.Compact style={{ width: '100%' }}>
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
                style={{ marginBottom: '24px' }}
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
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    {materialSeleccionado.codigoMaterial} - {materialSeleccionado.descripcion}
                  </Text>
                </div>
                
                <Descriptions size="small" bordered column={2}>
                  <Descriptions.Item label="Stock Actual" span={1}>
                    <Statistic value={materialSeleccionado.stockActual} valueStyle={{ fontSize: '14px' }} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Stock Reservado" span={1}>
                    <Statistic value={materialSeleccionado.stockReservado || 0} valueStyle={{ fontSize: '14px' }} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Stock Mínimo" span={1}>
                    <Statistic value={materialSeleccionado.stockMinimo} valueStyle={{ fontSize: '14px' }} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Ubicación" span={1}>
                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                      <strong>{materialSeleccionado.ubicacion}</strong>
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <Form.Item label="Cantidad a Ingresar *" style={{ marginBottom: 0 }}>
                  <Input
                    type="number"
                    placeholder="Ingresa la cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Card>
            )}
          </Col>
        </Row>

        {/* Lista de Materiales */}
        <Row>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <Text>Materiales a Ingresar</Text>
                  <Tag color="blue" style={{ fontSize: '14px' }}>
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
                    onClick={registrarEntrada}
                    loading={loading}
                    disabled={materiales.length === 0}
                    size="large"
                    icon={<ExclamationCircleOutlined />}
                  >
                    Registrar Entrada
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
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <ShoppingCartOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <br />
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    No hay materiales agregados. Busca y agrega materiales para registrar una entrada.
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Modal de Entradas Pendientes */}
      <Modal
        title={
          <Space>
            <ClockCircleOutlined />
            <span>Entradas por Aprobar</span>
            <Tag color="orange">{entradasPendientes.length} pendientes</Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={1000}
      >
        <Table
          dataSource={entradasPendientes}
          columns={columnasEntradas}
          loading={loadingEntradas}
          pagination={{ pageSize: 5 }}
          size="middle"
          scroll={{ x: 900 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                <br />
                <Text type="success">No hay entradas pendientes de aprobación</Text>
              </div>
            )
          }}
        />
      </Modal>
    </div>
  );
}