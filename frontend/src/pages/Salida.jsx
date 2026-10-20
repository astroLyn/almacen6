import { useState, useEffect } from "react";
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

export default function SalidaMaterial() {
  const { user } = useAuth(); 

  const [materiales, setMateriales] = useState([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [salidasPendientes, setSalidasPendientes] = useState([]);
  const [loadingSalidas, setLoadingSalidas] = useState(false);
  const [alertarSalida, setAlertarSalida] = useState(false);

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
  const [salidaARechazar, setSalidaARechazar] = useState(null);
  const [rechazando, setRechazando] = useState(false);

  const [fecha, setFecha] = useState(dayjs());
  const [cotizacion, setCotizacion] = useState("");
  const [cliente, setCliente] = useState("");
  
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]);
  
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [cargandoClientes, setCargandoClientes] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCargandoClientes(true);
        
        const [clientesRes, categoriasRes, ubicacionesRes, marcasRes] = await Promise.all([
          api.get("/clientes"),
          api.get("/categorias"),
          api.get("/ubicaciones"),
          api.get("/marcas") 
        ]);
        
        setClientes(clientesRes.data);
        setCategorias(categoriasRes.data); 
        setUbicaciones(ubicacionesRes.data);
        setMarcas(marcasRes.data);

      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        message.error("Error al cargar la información inicial");
      } finally {
        setCargandoClientes(false);
      }
    };
    
    fetchData();
  }, []);

  // 🌟 MAGIA EN TIEMPO REAL: Se dispara cada que cambias un filtro o escribes algo
  useEffect(() => {
    const buscarMaterialesDisponibles = async () => {
      setBuscandoMateriales(true);
      try {
        const { data } = await api.get("/materiales", {
          params: {
            descripcion: textoBusqueda || null,
            ubicacion: filtroUbicacion || null,
            marca: filtroMarca || null
          }
        });
        setOpcionesMateriales(data.filter(m => m.estado === 'ACT'));
      } catch (error) {
        console.error("Error buscando materiales:", error);
      } finally {
        setBuscandoMateriales(false);
      }
    };

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
      const res = await api.post("/clientes", { 
        nombre: nuevoCliente.trim(),
        nombreFiscal: nuevoCliente.trim(),
        rfc: "", direccion: "", telefono: "", email: ""
      });
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

  const cargarSalidasPendientes = async () => {
    setLoadingSalidas(true);
    try {
      const { data } = await api.get("/salidas/pendientes");
      setSalidasPendientes(data);
    } catch (error) {
      message.error("Error al cargar salidas pendientes");
    } finally {
      setLoadingSalidas(false);
    }
  };

  const cargarDetalleSalida = async (expanded, record) => {
    if (expanded && !detallesMateriales[record.noSalida]) {
      try {
        setCargandoDetalles(true);
        const { data } = await api.get(`/salidas/${record.noSalida}/materiales`);
        setDetallesMateriales(prev => ({
          ...prev, [record.noSalida]: data
        }));
      } catch (error) {
        message.error(`Error al cargar los materiales de la salida #${record.noSalida}`);
      } finally {
        setCargandoDetalles(false);
      }
    }
  };

  const aprobarSalida = async (noSalida) => {
    try {
      await api.put(`/salidas/${noSalida}/aprobar`);
      message.success(`✅ Salida #${noSalida} aprobada correctamente`);
      cargarSalidasPendientes();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al aprobar salida");
    }
  };

  const rechazarSalida = async (noSalida) => {
    try {
      setRechazando(true);
      await api.put(`/salidas/${noSalida}/rechazar`, { motivo: "" });
      message.success(`❌ Salida #${noSalida} rechazada correctamente`);
      cargarSalidasPendientes();
      cerrarModalRechazo();
    } catch (error) {
      message.error(error.response?.data?.error || "Error al rechazar salida");
    } finally {
      setRechazando(false);
    }
  };

  const abrirModalRechazo = (noSalida) => {
    setSalidaARechazar(noSalida);
    setModalRechazoVisible(true);
  };

  const cerrarModalRechazo = () => {
    setModalRechazoVisible(false);
    setSalidaARechazar(null);
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

    const stockDisponible = parseFloat(materialSeleccionado.stockActual || 0);
    const cantidadRequerida = parseFloat(cantidad);

    if (cantidadRequerida > stockDisponible) {
      message.error(`¡Alerta! Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles.`);
      return; 
    }

    setMateriales([
      ...materiales,
      {
        ...materialSeleccionado,
        cantidad: cantidadRequerida,
        key: materialSeleccionado.codigoMaterial
      },
    ]);

    message.success("Material preparado para salida");
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
    if (!fecha || !cotizacion || cotizacion.trim() === "") {
      message.error("Faltan datos obligatorios: Asegúrate de llenar Fecha y Cotización.");
      return;
    }
    setModalConfirmacionVisible(true);
  };

  const registrarSalida = async () => {
    if (!fecha || !cotizacion || materiales.length === 0) {
      message.warning("Faltan datos requeridos o no hay materiales agregados");
      return;
    }

    const payload = {
        OS: "N/A",
        fecha: fecha.format("YYYY-MM-DD"),
        cotizacion,
        cliente: cliente || null,
        usuarioSolicita: user?.nombreCompleto || user?.nombreUsuario || "Desconocido",      
        materiales: materiales.map((m) => ({
        codigoMaterial: m.codigoMaterial,
        cantidad: m.cantidad,
      })),
    };

    try {
      setLoading(true);
      const { data } = await api.post("/salidas", payload);
      
      if (user?.acceso === 'ENC') {
        message.success(`✅ Salida #${data.noSalida} registrada y APROBADA automáticamente.`);
      } else {
        message.success(`⏳ Salida #${data.noSalida} registrada. En espera de aprobación.`);
      }
      limpiarFormulario();
    } catch (error) {
      console.error("❌ Error del servidor:", error);
      message.error(error.response?.data?.error || "Error al registrar salida");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFecha(dayjs());
    setCotizacion("");
    setCliente("");
    setMateriales([]);
    setMaterialSeleccionado(null);
    setCantidad("");
    setAlertarSalida(false);
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

  const columnasSalidas = [
    { title: "N° Salida", dataIndex: "noSalida", key: "noSalida", width: 100 },
    { title: "Fecha", dataIndex: "fecha", key: "fecha", render: (fecha) => fecha ? new Date(fecha).toLocaleDateString() : "-" },
    { title: "Cotización", dataIndex: "cotizacion", key: "cotizacion", render: (cotizacion) => cotizacion || "-" },
    {
      title: "Cliente",
      dataIndex: "cliente",
      key: "cliente",
      render: (clienteId) => {
        if (!clienteId) return "-";
        const clienteEncontrado = clientes.find(c => c.claveCliente === clienteId);
        return clienteEncontrado ? (clienteEncontrado.nombre || clienteEncontrado.nombreFiscal) : `ID: ${clienteId}`;
      },
    },
    {
      title: "Solicitado por",
      dataIndex: "usuarioSolicita", 
      key: "usuarioSolicita",
      render: (usuario) => usuario ? <Tag icon={<UserOutlined />}>{usuario}</Tag> : <Text type="secondary">Sistema</Text>
    },
    {
      title: "Acción",
      key: "accion",
      render: (_, record) => (
        <Space>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => aprobarSalida(record.noSalida)} size="small">Aprobar</Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={() => abrirModalRechazo(record.noSalida)} size="small">Rechazar</Button>
        </Space>
      ),
    },
  ];

  const columnasDetalleMateriales = [
      { title: 'Código', dataIndex: 'codigoMaterial', key: 'codigoMaterial' },
      { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion' },
      { title: 'Cantidad Solicitada', dataIndex: 'cantidad', key: 'cantidad', render: (cant) => <Tag color="blue">{cant}</Tag> },
      { title: 'Stock Actual', dataIndex: 'stockActual', key: 'stockActual', render: (stock) => <Text strong>{stock}</Text> },
    ];

  const columnas = [
    { 
      title: "Código", 
      dataIndex: "codigoMaterial", 
      key: "codigoMaterial", 
      width: 120,
      render: (text) => <Text strong>{text}</Text>
    },
    { 
      title: "Descripción", 
      dataIndex: "descripcion", 
      key: "descripcion",
      ellipsis: true
    },
    { 
      title: "Ubicación", 
      dataIndex: "ubicacion", 
      key: "ubicacion",
      width: 130,
      render: (codigoUbi) => {
        const ubi = ubicaciones.find(u => u.codigoUbicacion === codigoUbi || u.nombre === codigoUbi);
        return (
          <Tag color="default" style={{ borderStyle: 'dashed' }}>
            {ubi ? (ubi.nombre || ubi.ubicacion) : (codigoUbi || 'N/A')}
          </Tag>
        );
      }
    },
    { 
      title: "Cant. a Retirar",
      dataIndex: "cantidad", 
      key: "cantidad", 
      width: 150, 
      align: 'center',
      render: (cantidad) => (
        <Tag color="volcano" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}>
          -{cantidad} uds
        </Tag>
      ) 
    },
    { 
      title: "Acción", 
      key: "accion", 
      width: 80, 
      align: 'center', 
      render: (_, record) => (
        <Tooltip title="Eliminar de la lista">
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined style={{ fontSize: '16px' }} />} 
            onClick={() => eliminarMaterial(record.codigoMaterial)} 
          />
        </Tooltip>
      ) 
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <Card style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} bodyStyle={{ padding: "32px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <Title level={2} style={{ margin: 0, color: "#fa8c16" }}>
              <ShoppingCartOutlined style={{ marginRight: "12px" }} /> Salida de Materiales
            </Title>
            <Text type="secondary">Registra la salida de materiales del almacén</Text>
          </div>

          {user?.acceso === 'ENC' && (
            <Badge count={salidasPendientes.length} size="small" offset={[-10, 10]}>
              <Button type="default" icon={<ClockCircleOutlined />} onClick={() => { setModalVisible(true); cargarSalidasPendientes(); }} size="large">
                Salidas por Aprobar
              </Button>
            </Badge>
          )}
        </div>

        <Card title="Datos de la Salida" style={{ marginBottom: "24px" }} extra={
          <Space><Text>Alertar salida</Text><Switch checked={alertarSalida} onChange={setAlertarSalida} checkedChildren="Sí" unCheckedChildren="No" /></Space>
        }>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Fecha" required>
                <DatePicker value={fecha} onChange={setFecha} style={{ width: "100%" }} format="DD/MM/YYYY" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Cotización" required>
                <Input placeholder="Número de cotización" value={cotizacion} onChange={(e) => setCotizacion(e.target.value)} size="large" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Cliente">
                <Select showSearch placeholder="Escribe o selecciona un cliente" value={cliente} onChange={setCliente} optionFilterProp="children" size="large" style={{ width: "100%" }} dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Space.Compact style={{ width: "100%", padding: "0 8px 4px" }}>
                        <Input placeholder="Nuevo cliente" value={nuevoCliente} onChange={(e) => setNuevoCliente(e.target.value)} onPressEnter={agregarNuevoCliente} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={agregarNuevoCliente} loading={cargandoClientes}>Agregar</Button>
                      </Space.Compact>
                    </>
                  )}>
                  {clientes.map((c) => (
                    <Option key={c.claveCliente} value={c.claveCliente}>{c.nombre || c.nombreFiscal || `Cliente ${c.claveCliente}`}</Option>
                  ))}
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
                  <Button onClick={() => { setFiltroUbicacion(null); setFiltroMarca(null); setTextoBusqueda(""); }} style={{ width: '100%' }}>Limpiar</Button>
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
                <div style={{ marginBottom: "16px" }}><Text strong style={{ fontSize: "16px" }}>{materialSeleccionado.codigoMaterial} - {materialSeleccionado.descripcion}</Text></div>
                <Descriptions size="small" bordered column={2}>
                  <Descriptions.Item label="Stock Actual"><Statistic value={materialSeleccionado.stockActual} valueStyle={{ fontSize: "14px", color: materialSeleccionado.stockActual <= 0 ? 'red' : 'inherit' }} /></Descriptions.Item>
                  <Descriptions.Item label="Ubicación"><Tag color="blue"><strong>{materialSeleccionado.ubicacion}</strong></Tag></Descriptions.Item>
                  {materialSeleccionado.marca && <Descriptions.Item label="Marca"><Text>{materialSeleccionado.marca}</Text></Descriptions.Item>}
                </Descriptions>
                <Divider />
                <Form.Item label="Cantidad a Retirar *" style={{ marginBottom: 0 }}>
                  <Input type="number" placeholder="Ingresa la cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)} size="large" onPressEnter={agregarMaterial} />
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
            <Card title={<Space><Text>Materiales a Retirar</Text><Tag color="blue">{materiales.length} material(es)</Tag></Space>} extra={
                <Space>
                  <Button onClick={() => setMateriales([])} danger size="large">Vaciar Lista</Button>
                  <Button type="primary" onClick={confirmarRegistro} loading={loading} disabled={materiales.length === 0} size="large" icon={<ExclamationCircleOutlined />}>Registrar Salida</Button>
                </Space>
              }>
              {materiales.length > 0 ? (
                <Table dataSource={materiales} columns={columnas} pagination={false} size="middle" scroll={{ x: 800 }} />
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0" }}><ShoppingCartOutlined style={{ fontSize: "48px", color: "#d9d9d9", marginBottom: "16px" }} /><br /><Text type="secondary">No hay materiales agregados.</Text></div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Confirmar Registro de Salidas</span>
          </Space>
        }
        open={modalConfirmacionVisible}
        onOk={async () => {
          setModalConfirmacionVisible(false);
          await registrarSalida();
        }}
        onCancel={() => setModalConfirmacionVisible(false)}
        okText="Sí, registrar"
        cancelText="Cancelar"
        confirmLoading={loading}
      >
        <div style={{ padding: "10px 0" }}>
          <Text style={{ fontSize: "16px" }}>
            ¿Estás segura de registrar la salida de <strong>{materiales.length} material(es)</strong>?
          </Text>
        </div>
      </Modal>

      <Modal title={<Space><ClockCircleOutlined /><span>Salidas por Aprobar</span><Tag color="orange">{salidasPendientes.length} pendientes</Tag></Space>} open={modalVisible} onCancel={() => setModalVisible(false)} footer={[<Button key="close" onClick={() => setModalVisible(false)}>Cerrar</Button>]} width={1000}>
        <Table dataSource={salidasPendientes} columns={columnasSalidas} loading={loadingSalidas} rowKey="noSalida" pagination={{ pageSize: 5 }} size="middle" expandable={{
            onExpand: cargarDetalleSalida,
            expandedRowRender: (record) => (
              <div style={{ margin: '0 20px', padding: '16px', backgroundColor: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: '8px' }}>
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>Materiales solicitados en esta salida:</Text>
                <Table columns={columnasDetalleMateriales} dataSource={detallesMateriales[record.noSalida] || []} pagination={false} size="small" loading={cargandoDetalles && !detallesMateriales[record.noSalida]} rowKey="codigoMaterial" />
              </div>
            ),
          }} locale={{ emptyText: <div style={{ textAlign: "center", padding: "40px 0" }}><CheckCircleOutlined style={{ fontSize: "32px", color: "#52c41a" }} /><br /><Text>No hay salidas pendientes de aprobación</Text></div> }} />
      </Modal>

      <Modal title={<Space><CloseCircleOutlined style={{ color: "#ff4d4f" }} /><span>Rechazar Salida #{salidaARechazar}</span></Space>} open={modalRechazoVisible} onCancel={cerrarModalRechazo} footer={[<Button key="cancel" onClick={cerrarModalRechazo}>Cancelar</Button>, <Button key="reject" type="primary" danger loading={rechazando} onClick={() => rechazarSalida(salidaARechazar)} icon={<CloseCircleOutlined />}>Rechazar Salida</Button>]} width={400}>
        <div style={{ textAlign: "center", padding: "20px 0" }}><CloseCircleOutlined style={{ fontSize: "48px", color: "#ff4d4f", marginBottom: "16px" }} /><Title level={4} style={{ marginBottom: "8px" }}>¿Rechazar esta salida?</Title><Text type="secondary">Esta acción marcará la salida como rechazada. No se realizarán cambios en el inventario.</Text></div>
      </Modal>
    </div>
  );
}