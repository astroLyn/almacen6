import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext.jsx";
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
  Select,
  Tooltip
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function EntradaMaterial() {
  const { user } = useAuth();

  const [materiales, setMateriales] = useState([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [entradasPendientes, setEntradasPendientes] = useState([]);
  const [loadingEntradas, setLoadingEntradas] = useState(false);
  const [alertarEntrada, setAlertarEntrada] = useState(false);

  const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);

  // 🔍 NUEVO: Estado de texto de búsqueda en tiempo real
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [opcionesMateriales, setOpcionesMateriales] = useState([]);
  const [buscandoMateriales, setBuscandoMateriales] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState(null);
  const [filtroMarca, setFiltroMarca] = useState(null);

  const [detallesMateriales, setDetallesMateriales] = useState({});
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  const [modalRechazoVisible, setModalRechazoVisible] = useState(false);
  const [entradaSeleccionada, setEntradaSeleccionada] = useState(null);
  const [rechazando, setRechazando] = useState(false);

  const [OS, setOS] = useState("");
  const [fecha, setFecha] = useState(dayjs());
  const [proveedor, setProveedor] = useState("");
  const [cliente, setCliente] = useState("");
  
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]); 
  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCargandoClientes(true);
        setCargandoProveedores(true);
        const [clientesRes, proveedoresRes, categoriasRes, ubicacionesRes, marcasRes] = await Promise.all([
          api.get("/clientes"),
          api.get("/proveedores"),
          api.get("/categorias"),
          api.get("/ubicaciones"),
          api.get("/marcas") 
        ]);
        setClientes(clientesRes.data);
        setProveedores(proveedoresRes.data);
        setCategorias(categoriasRes.data);
        setUbicaciones(ubicacionesRes.data);
        setMarcas(marcasRes.data);
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        message.error("Error al cargar la información inicial");
      } finally {
        setCargandoClientes(false);
        setCargandoProveedores(false);
      }
    };
    fetchData();
  }, []);

  // 🌟 MAGIA EN TIEMPO REAL: Se dispara cada que cambias un filtro o escribes algo
  useEffect(() => {
    const buscarMaterialesDisponibles = async () => {
      setBuscandoMateriales(true);
      try {
        // Usamos tu ruta general de materiales que ya acepta los 4 filtros
        const { data } = await api.get("/materiales", {
          params: {
            descripcion: textoBusqueda || null,
            ubicacion: filtroUbicacion || null,
            marca: filtroMarca || null
          }
        });
        // Filtramos para que solo aparezcan los activos en la tabla
        setOpcionesMateriales(data.filter(m => m.estado === 'ACT'));
      } catch (error) {
        console.error("Error buscando materiales:", error);
      } finally {
        setBuscandoMateriales(false);
      }
    };

    // Le ponemos un pequeño retraso de 300ms al texto para no saturar el servidor al teclear rápido
    const timer = setTimeout(() => {
      buscarMaterialesDisponibles();
    }, 300);

    return () => clearTimeout(timer);
  }, [textoBusqueda, filtroUbicacion, filtroMarca]);

  const agregarNuevoCliente = async () => {
    if (!nuevoCliente.trim()) {
      message.warning("Escribe un nombre para el nuevo cliente");
      return;
    }
    try {
      setCargandoClientes(true);
      const res = await api.post("/clientes", { nombreFiscal: nuevoCliente.trim() });
      const clienteCreado = res.data;
      setClientes(prev => [...prev, clienteCreado]);
      setCliente(clienteCreado.claveCliente);
      message.success("Cliente agregado correctamente");
      setNuevoCliente("");
    } catch (error) {
      message.error(error.response?.data?.detalle || "No se pudo agregar el cliente");
    } finally {
      setCargandoClientes(false);
    }
  };

  const agregarNuevoProveedor = async () => {
    if (!nuevoProveedor.trim()) {
      message.warning("Escribe un nombre para el nuevo proveedor");
      return;
    }
    try {
      setCargandoProveedores(true);
      await api.post("/proveedores", { nombre: nuevoProveedor.trim() });
      message.success("Proveedor agregado correctamente");
      const proveedoresRes = await api.get("/proveedores");
      setProveedores(proveedoresRes.data);
      const proveedorCreado = proveedoresRes.data.find(p => p.nombre === nuevoProveedor.trim());
      if (proveedorCreado) setProveedor(proveedorCreado.codigo);
      setNuevoProveedor("");
    } catch (error) {
      message.error(error.response?.data?.message || "No se pudo agregar el proveedor");
    } finally {
      setCargandoProveedores(false);
    }
  };

  const cargarEntradasPendientes = async () => {
    setLoadingEntradas(true);
    try {
      const { data } = await api.get("/entradas/pendientes");
      setEntradasPendientes(data);
    } catch (error) {
      message.error("Error al cargar entradas pendientes");
    } finally {
      setLoadingEntradas(false);
    }
  };

  const cargarDetalleEntrada = async (expanded, record) => {
    if (expanded && !detallesMateriales[record.noEntrada]) {
      try {
        setCargandoDetalles(true);
        const { data } = await api.get(`/entradas/${record.noEntrada}/materiales`);
        setDetallesMateriales(prev => ({
          ...prev,
          [record.noEntrada]: data
        }));
      } catch (error) {
        message.error(`Error al cargar los materiales de la entrada #${record.noEntrada}`);
      } finally {
        setCargandoDetalles(false);
      }
    }
  };

  const aprobarEntrada = async (noEntrada) => {
    try {
      await api.put(`/entradas/${noEntrada}/aprobar`);
      message.success(`✅ Entrada #${noEntrada} aprobada correctamente`);
      cargarEntradasPendientes();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al aprobar entrada");
    }
  };

  const rechazarEntrada = async (noEntrada) => {
    setRechazando(true);
    try {
      await api.put(`/entradas/${noEntrada}/rechazar`);
      message.success(`❌ Entrada #${noEntrada} rechazada correctamente`);
      setModalRechazoVisible(false);
      setEntradaSeleccionada(null);
      cargarEntradasPendientes();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al rechazar entrada");
    } finally {
      setRechazando(false);
    }
  };

  const abrirModalRechazo = (entrada) => {
    setEntradaSeleccionada(entrada);
    setModalRechazoVisible(true);
  };

  const agregarMaterial = () => {
    if (!materialSeleccionado || !cantidad || Number(cantidad) <= 0) {
      message.warning("Seleccione un material e ingrese una cantidad válida mayor a 0");
      return;
    }
    const existe = materiales.find((m) => m.codigoMaterial === materialSeleccionado.codigoMaterial);
    if (existe) {
      message.warning("Este material ya fue agregado a la lista");
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
    message.success("Material preparado para ingreso");
    setCantidad("");
    setMaterialSeleccionado(null);
  };

  const eliminarMaterial = (codigo) => {
    setMateriales(materiales.filter((m) => m.codigoMaterial !== codigo));
    message.success("Material removido de la lista");
  };

  const confirmarRegistro = () => {
    if (materiales.length === 0) {
      message.warning("No hay materiales en la lista para registrar.");
      return;
    }
    if (!OS || !fecha || !proveedor) {
      message.error("Faltan datos obligatorios: Asegúrate de llenar N° OS, Fecha y Proveedor.");
      return;
    }
    setModalConfirmacionVisible(true);
  };

  const registrarEntrada = async () => {
    const payload = {
      OS,
      fecha: fecha.format('YYYY-MM-DD'),
      proveedor,
      cliente: cliente || null,
      usuarioSolicita: user?.nombreCompleto || user?.nombreUsuario || "Desconocido",
      materiales: materiales.map((m) => ({
        codigoMaterial: m.codigoMaterial,
        cantidad: m.cantidad,
      })),
    };

    try {
      setLoading(true);
      const { data } = await api.post("/entradas", payload);

      if (user?.acceso === 'ENC') {
        message.success(`✅ Entrada #${data.noEntrada} registrada y APROBADA automáticamente.`);
      } else {
        message.success(`⏳ Entrada #${data.noEntrada} registrada. En espera de aprobación.`);
      }
      
      limpiarFormulario();
    } catch (error) {
      console.error("❌ Error detectado en la petición:", error);
      message.error(error.response?.data?.error || "Error de red al registrar entrada");
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
    setCantidad("");
    setAlertarEntrada(false);
    setTextoBusqueda("");
    setFiltroUbicacion(null);
    setFiltroMarca(null);
  };

  // 🌟 COLUMNAS PARA LA NUEVA MINI-TABLA BÚSQUEDA
  const columnasBusqueda = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigo", width: 100 },
    { title: "Descripción", dataIndex: "descripcion", key: "desc", ellipsis: true },
    { title: "Stock", dataIndex: "stockActual", key: "stock", width: 70, render: (s) => <Text strong>{s}</Text> },
    { 
      title: "", 
      key: "accion", 
      width: 100, 
      render: (_, record) => (
        <Button size="small" type="primary" onClick={() => setMaterialSeleccionado(record)}>
          Seleccionar
        </Button>
      )
    }
  ];

  const columnasEntradas = [
    { title: "N° Entrada", dataIndex: "noEntrada", key: "noEntrada", width: 100 },
    { title: "OS", dataIndex: "OS", key: "OS", width: 120 },
    { title: "Fecha", dataIndex: "fecha", key: "fecha", render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : "-" },
    {
      title: "Proveedor", dataIndex: "proveedorId", key: "proveedorId",
      render: (provId) => {
        if (!provId) return "-";
        const provEncontrado = proveedores.find(p => p.codigo === provId);
        return provEncontrado ? provEncontrado.nombre : `Proveedor ${provId}`;
      },
    },
    {
      title: "Solicitado por",
      dataIndex: "nombreUsuario",
      key: "nombreUsuario",
      render: (usuario) => usuario ? <Tag icon={<UserOutlined />}>{usuario}</Tag> : <Text type="secondary">Sistema</Text>
    },
    {
      title: "Acciones", key: "acciones", width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => aprobarEntrada(record.noEntrada)} size="small">Aprobar</Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={() => abrirModalRechazo(record)} size="small">Rechazar</Button>
        </Space>
      ),
    },
  ];

  const columnasDetalleMateriales = [
    { title: 'Código', dataIndex: 'codigoMaterial', key: 'codigoMaterial' },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion' },
    { title: 'Cantidad a Ingresar', dataIndex: 'cantidad', key: 'cantidad', render: (cant) => <Tag color="green">+{cant}</Tag> },
    { title: 'Stock Actual', dataIndex: 'stockActual', key: 'stockActual', render: (stock) => <Text strong>{stock}</Text> },
  ];

  const columnas = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigoMaterial", width: 120, render: (text) => <Text strong>{text}</Text> },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion", ellipsis: true },
    {
      title: "Ubicación", dataIndex: "ubicacion", key: "ubicacion", width: 130,
      render: (codigoUbi) => {
        const ubi = ubicaciones.find(u => u.codigoUbicacion === codigoUbi || u.nombre === codigoUbi);
        return <Tag color="default" style={{ borderStyle: 'dashed' }}>{ubi ? (ubi.nombre || ubi.ubicacion) : (codigoUbi || 'N/A')}</Tag>;
      }
    },
    {
      title: "Cant. a Ingresar", dataIndex: "cantidad", key: "cantidad", width: 150, align: 'center',
      render: (cantidad) => <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>+{cantidad} uds</Tag>
    },
    {
      title: "Acción", key: "accion", width: 80, align: 'center',
      render: (_, record) => (
        <Tooltip title="Eliminar de la lista">
          <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: '16px' }} />} onClick={() => eliminarMaterial(record.codigoMaterial)} />
        </Tooltip>
      )
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} bodyStyle={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}><ShoppingCartOutlined style={{ marginRight: '12px' }} />Entrada de Materiales</Title>
            <Text type="secondary">Registra la entrada de materiales al almacén</Text>
          </div>
          {user?.acceso === 'ENC' && (
            <Badge count={entradasPendientes.length} size="small" offset={[-10, 10]}>
              <Button type="default" icon={<ClockCircleOutlined />} onClick={() => { setModalVisible(true); cargarEntradasPendientes(); }} size="large">
                Entradas por Aprobar
              </Button>
            </Badge>
          )}
        </div>

        <Card title="Datos de la Entrada" style={{ marginBottom: '24px' }} extra={<Space><Text>Alertar entrada</Text><Switch checked={alertarEntrada} onChange={setAlertarEntrada} checkedChildren="Sí" unCheckedChildren="No" /></Space>}>
          <Row gutter={16}>
            <Col span={6}><Form.Item label="N° OS" required><Input placeholder="Número de OS" value={OS} onChange={(e) => setOS(e.target.value)} size="large" /></Form.Item></Col>
            <Col span={6}><Form.Item label="Fecha" required><DatePicker value={fecha} onChange={setFecha} style={{ width: '100%' }} format="DD/MM/YYYY" size="large" /></Form.Item></Col>
            <Col span={6}>
              <Form.Item label="Proveedor" required>
                <Select showSearch placeholder="Escribe o selecciona un proveedor" value={proveedor} onChange={setProveedor} optionFilterProp="children" filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space.Compact style={{ width: "100%", padding: "0 8px 4px" }}>
                      <Input placeholder="Nuevo proveedor" value={nuevoProveedor} onChange={(e) => setNuevoProveedor(e.target.value)} onPressEnter={agregarNuevoProveedor} />
                      <Button type="primary" icon={<PlusOutlined />} onClick={agregarNuevoProveedor} loading={cargandoProveedores}>Agregar</Button>
                    </Space.Compact>
                  </>
                )} size="large" style={{ width: "100%" }}>
                  {proveedores.map((p) => <Option key={p.codigo} value={p.codigo}>{p.nombre}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Cliente (opcional)">
                <Select showSearch placeholder="Escribe o selecciona un cliente" value={cliente} onChange={setCliente} optionFilterProp="children" filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space.Compact style={{ width: "100%", padding: "0 8px 4px" }}>
                      <Input placeholder="Nuevo cliente" value={nuevoCliente} onChange={(e) => setNuevoCliente(e.target.value)} onPressEnter={agregarNuevoCliente} />
                      <Button type="primary" icon={<PlusOutlined />} onClick={agregarNuevoCliente} loading={cargandoClientes}>Agregar</Button>
                    </Space.Compact>
                  </>
                )} size="large" style={{ width: "100%" }}>
                  {clientes.map((c) => <Option key={c.claveCliente} value={c.claveCliente}>{c.nombreFiscal || `Cliente ${c.claveCliente}`}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="Buscar Material" style={{ height: '100%' }}>
              
              <Row gutter={8} style={{ marginBottom: 12 }}>
                <Col span={9}>
                  <Select
                    allowClear
                    placeholder="Filtrar por Ubicación"
                    style={{ width: '100%' }}
                    value={filtroUbicacion}
                    onChange={setFiltroUbicacion}
                  >
                    {ubicaciones.map((u, i) => {
                      const valor = u.codigoUbicacion || u.codigo || u.id || u.clave || i;
                      const texto = u.nombre || u.descripcion || u.ubicacion || `Ubicación ${valor}`;
                      return <Option key={valor} value={valor}>{texto}</Option>;
                    })}
                  </Select>
                </Col>
                <Col span={9}>
                  <Select
                    allowClear
                    placeholder="Filtrar por Marca"
                    style={{ width: '100%' }}
                    value={filtroMarca}
                    onChange={setFiltroMarca}
                  >
                    {marcas.map((m, i) => {
                      const valor = m.claveMarca || m.codigo || m.id || i;
                      const texto = m.nombre || m.descripcion || m.marca || `Marca ${valor}`;
                      return <Option key={valor} value={valor}>{texto}</Option>;
                    })}
                  </Select>
                </Col>
                <Col span={6}>
                  <Button 
                    onClick={() => { setFiltroUbicacion(null); setFiltroMarca(null); setTextoBusqueda(""); }} 
                    style={{ width: '100%' }}
                  >
                    Limpiar
                  </Button>
                </Col>
              </Row>

              <Search
                placeholder="Escribe código o descripción..."
                allowClear
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
                style={{ width: '100%', marginBottom: 16 }}
              />

              {/* 🌟 AQUÍ ESTÁ LA NUEVA TABLA DE RESULTADOS */}
              <Table 
                dataSource={opcionesMateriales} 
                columns={columnasBusqueda} 
                rowKey="codigoMaterial"
                size="small"
                pagination={{ pageSize: 5 }}
                loading={buscandoMateriales}
                bordered
              />

            </Card>
          </Col>
          <Col span={12}>
            {materialSeleccionado ? (
              <Card title="Material Seleccionado" extra={<Button type="primary" icon={<PlusOutlined />} onClick={agregarMaterial} disabled={!cantidad} size="large">Agregar</Button>} style={{ height: '100%' }}>
                <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: 16 }}>{materialSeleccionado.codigoMaterial} - {materialSeleccionado.descripcion}</Text>
                <Descriptions size="small" bordered column={2}>
                  <Descriptions.Item label="Stock Actual"><Statistic value={materialSeleccionado.stockActual} valueStyle={{ fontSize: '14px' }} /></Descriptions.Item>
                  <Descriptions.Item label="Ubicación"><Tag color="blue"><strong>{materialSeleccionado.ubicacion}</strong></Tag></Descriptions.Item>
                  {materialSeleccionado.marca && <Descriptions.Item label="Marca"><Text>{materialSeleccionado.marca}</Text></Descriptions.Item>}
                </Descriptions>
                <Divider />
                <Form.Item label="Cantidad a Ingresar *" style={{ marginBottom: 0 }}>
                  <Input type="number" placeholder="Ingresa la cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)} size="large" style={{ width: '100%' }} onPressEnter={agregarMaterial} />
                </Form.Item>
              </Card>
            ) : (
              <Card style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <div style={{ textAlign: 'center', color: '#bfbfbf' }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <p>Selecciona un material de la tabla para agregarlo.</p>
                </div>
              </Card>
            )}
          </Col>
        </Row>

        <Row style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card
              title={<Space><Text>Materiales a Ingresar</Text><Tag color="blue">{materiales.length} material(es)</Tag></Space>}
              extra={
                <Space>
                  <Button onClick={() => setMateriales([])} danger size="large">Vaciar Lista</Button>
                  <Button
                    type="primary"
                    onClick={confirmarRegistro}
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
                <Table dataSource={materiales} columns={columnas} pagination={false} size="middle" />
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}><ShoppingCartOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} /><br /><Text type="secondary">No hay materiales agregados.</Text></div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Confirmar Registro de Entradas</span>
          </Space>
        }
        open={modalConfirmacionVisible}
        onOk={async () => {
          setModalConfirmacionVisible(false);
          await registrarEntrada();
        }}
        onCancel={() => setModalConfirmacionVisible(false)}
        okText="Sí, registrar"
        cancelText="Cancelar"
        confirmLoading={loading}
      >
        <div style={{ padding: "10px 0" }}>
          <Text style={{ fontSize: "16px" }}>
            ¿Estás segura de registrar la entrada de <strong>{materiales.length} material(es)</strong>?
          </Text>
        </div>
      </Modal>

      <Modal
        title={<Space><ClockCircleOutlined /><span>Entradas por Aprobar</span><Tag color="orange">{entradasPendientes.length} pendientes</Tag></Space>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[<Button key="close" onClick={() => setModalVisible(false)}>Cerrar</Button>]}
        width={1000}
      >
        <Table
          dataSource={entradasPendientes}
          columns={columnasEntradas}
          loading={loadingEntradas}
          rowKey="noEntrada"
          pagination={{ pageSize: 5 }}
          size="middle"
          expandable={{
            onExpand: cargarDetalleEntrada,
            expandedRowRender: (record) => (
              <div style={{ margin: '0 20px', padding: '16px', backgroundColor: '#f6ffed', border: '1px dashed #b7eb8f', borderRadius: '8px' }}>
                <Text strong style={{ display: 'block', marginBottom: '12px', color: '#389e0d' }}>Materiales a ingresar en esta solicitud:</Text>
                <Table
                  columns={columnasDetalleMateriales}
                  dataSource={detallesMateriales[record.noEntrada] || []}
                  pagination={false}
                  size="small"
                  loading={cargandoDetalles && !detallesMateriales[record.noEntrada]}
                  rowKey="codigoMaterial"
                />
              </div>
            ),
          }}
          locale={{ emptyText: <div style={{ textAlign: 'center', padding: '40px 0' }}><CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} /><br /><Text type="success">No hay entradas pendientes de aprobación</Text></div> }}
        />
      </Modal>

      <Modal title={<Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /><span>Rechazar Entrada #{entradaSeleccionada?.noEntrada}</span></Space>} open={modalRechazoVisible} onCancel={() => { setModalRechazoVisible(false); setEntradaSeleccionada(null); }} footer={[<Button key="cancel" onClick={() => { setModalRechazoVisible(false); setEntradaSeleccionada(null); }}>Cancelar</Button>, <Button key="reject" type="primary" danger loading={rechazando} onClick={() => rechazarEntrada(entradaSeleccionada?.noEntrada)} icon={<CloseCircleOutlined />}>Rechazar Entrada</Button>]} width={400}>
        <div style={{ textAlign: "center", padding: "20px 0" }}><CloseCircleOutlined style={{ fontSize: "48px", color: "#ff4d4f", marginBottom: "16px" }} /><Title level={4} style={{ marginBottom: "8px" }}>¿Rechazar esta entrada?</Title><Text type="secondary">Esta acción marcará la entrada como rechazada. No se sumará stock al inventario.</Text></div>
      </Modal>
    </div>
  );
}