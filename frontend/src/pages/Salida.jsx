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
  Tooltip,
  Grid,
  Empty,
  Collapse,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { useBreakpoint } = Grid;

export default function SalidaMaterial() {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const [materiales, setMateriales] = useState([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [salidasPendientes, setSalidasPendientes] = useState([]);
  const [loadingSalidas, setLoadingSalidas] = useState(false);
  const [alertarSalida, setAlertarSalida] = useState(false);
  const [modalConfirmacionVisible, setModalConfirmacionVisible] =
    useState(false);

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

        const [clientesRes, categoriasRes, ubicacionesRes, marcasRes] =
          await Promise.all([
            api.get("/clientes"),
            api.get("/categorias"),
            api.get("/ubicaciones"),
            api.get("/marcas"),
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

  useEffect(() => {
    const buscarMaterialesDisponibles = async () => {
      setBuscandoMateriales(true);
      try {
        const { data } = await api.get("/materiales", {
          params: {
            descripcion: textoBusqueda || null,
            ubicacion: filtroUbicacion || null,
            marca: filtroMarca || null,
          },
        });
        setOpcionesMateriales(data.filter((m) => m.estado === "ACT"));
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
        rfc: "",
        direccion: "",
        telefono: "",
        email: "",
      });
      const clienteCreado = res.data;
      setClientes((prev) => [...prev, clienteCreado]);
      setCliente(clienteCreado.claveCliente);
      message.success("Cliente agregado correctamente");
      setNuevoCliente("");
    } catch (error) {
      message.error(
        error.response?.data?.detalle || "No se pudo agregar el cliente"
      );
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
        const { data } = await api.get(
          `/salidas/${record.noSalida}/materiales`
        );
        setDetallesMateriales((prev) => ({
          ...prev,
          [record.noSalida]: data,
        }));
      } catch (error) {
        message.error(
          `Error al cargar los materiales de la salida #${record.noSalida}`
        );
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
      message.warning(
        "Seleccione un material e ingrese una cantidad válida mayor a 0"
      );
      return;
    }

    const existe = materiales.find(
      (m) => m.codigoMaterial === materialSeleccionado.codigoMaterial
    );
    if (existe) {
      message.warning("Este material ya fue agregado a la lista");
      return;
    }

    const stockDisponible = parseFloat(materialSeleccionado.stockActual || 0);
    const cantidadRequerida = parseFloat(cantidad);

    if (cantidadRequerida > stockDisponible) {
      message.error(
        `¡Alerta! Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles.`
      );
      return;
    }

    setMateriales([
      ...materiales,
      {
        ...materialSeleccionado,
        cantidad: cantidadRequerida,
        key: materialSeleccionado.codigoMaterial,
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
      message.error(
        "Faltan datos obligatorios: Asegúrate de llenar Fecha y Cotización."
      );
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
      usuarioSolicita:
        user?.nombreCompleto || user?.nombreUsuario || "Desconocido",
      materiales: materiales.map((m) => ({
        codigoMaterial: m.codigoMaterial,
        cantidad: m.cantidad,
      })),
    };

    try {
      setLoading(true);
      const { data } = await api.post("/salidas", payload);

      if (user?.acceso === "ENC") {
        message.success(
          `✅ Salida #${data.noSalida} registrada y APROBADA automáticamente.`
        );
      } else {
        message.success(
          `⏳ Salida #${data.noSalida} registrada. En espera de aprobación.`
        );
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

  const columnasBusqueda = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigo", width: 100 },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "desc",
      ellipsis: true,
    },
    {
      title: "Stock",
      dataIndex: "stockActual",
      key: "stock",
      width: 70,
      render: (s) => <Text strong>{s}</Text>,
    },
    {
      title: "",
      key: "accion",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          onClick={() => setMaterialSeleccionado(record)}
        >
          Seleccionar
        </Button>
      ),
    },
  ];

  const columnasSalidas = [
    {
      title: "N° Salida",
      dataIndex: "noSalida",
      key: "noSalida",
      width: 100,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (fecha) =>
        fecha ? new Date(fecha).toLocaleDateString() : "-",
    },
    {
      title: "Cotización",
      dataIndex: "cotizacion",
      key: "cotizacion",
      render: (cotizacion) => cotizacion || "-",
    },
    {
      title: "Cliente",
      dataIndex: "cliente",
      key: "cliente",
      render: (clienteId) => {
        if (!clienteId) return "-";
        const clienteEncontrado = clientes.find(
          (c) => c.claveCliente === clienteId
        );
        return clienteEncontrado
          ? clienteEncontrado.nombre || clienteEncontrado.nombreFiscal
          : `ID: ${clienteId}`;
      },
    },
    {
      title: "Solicitado por",
      dataIndex: "usuarioSolicita",
      key: "usuarioSolicita",
      render: (usuario) =>
        usuario ? (
          <Tag icon={<UserOutlined />}>{usuario}</Tag>
        ) : (
          <Text type="secondary">Sistema</Text>
        ),
    },
    {
      title: "Acción",
      key: "accion",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => aprobarSalida(record.noSalida)}
            size="small"
          >
            Aprobar
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => abrirModalRechazo(record.noSalida)}
            size="small"
          >
            Rechazar
          </Button>
        </Space>
      ),
    },
  ];

  const columnasDetalleMateriales = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigoMaterial" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    {
      title: "Cantidad Solicitada",
      dataIndex: "cantidad",
      key: "cantidad",
      render: (cant) => <Tag color="blue">{cant}</Tag>,
    },
    {
      title: "Stock Actual",
      dataIndex: "stockActual",
      key: "stockActual",
      render: (stock) => <Text strong>{stock}</Text>,
    },
  ];

  const columnas = [
    {
      title: "Código",
      dataIndex: "codigoMaterial",
      key: "codigoMaterial",
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
    },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      width: 130,
      render: (codigoUbi) => {
        const ubi = ubicaciones.find(
          (u) => u.codigoUbicacion === codigoUbi || u.nombre === codigoUbi
        );
        return (
          <Tag color="default" style={{ borderStyle: "dashed" }}>
            {ubi ? ubi.nombre || ubi.ubicacion : codigoUbi || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Cant. a Retirar",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 150,
      align: "center",
      render: (cantidad) => (
        <Tag
          color="volcano"
          style={{
            fontSize: "14px",
            padding: "4px 12px",
            borderRadius: "4px",
          }}
        >
          -{cantidad} uds
        </Tag>
      ),
    },
    {
      title: "Acción",
      key: "accion",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Eliminar de la lista">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined style={{ fontSize: "16px" }} />}
            onClick={() => eliminarMaterial(record.codigoMaterial)}
          />
        </Tooltip>
      ),
    },
  ];

  // 🎴 Card móvil de resultado de búsqueda
  const renderMaterialBusquedaCard = (record) => (
    <Card
      key={record.codigoMaterial}
      size="small"
      style={{ marginBottom: 8 }}
      styles={{ body: { padding: 10 } }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 12 }}>
            {record.codigoMaterial}
          </Text>
          <div
            style={{
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={record.descripcion}
          >
            {record.descripcion}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            Stock: <Text strong>{record.stockActual}</Text>
          </div>
        </div>
        <Button
          size="small"
          type="primary"
          onClick={() => setMaterialSeleccionado(record)}
        >
          Seleccionar
        </Button>
      </div>
    </Card>
  );

  // 🎴 Card móvil de material a retirar
  const renderMaterialSalidaCard = (record) => {
    const ubi = ubicaciones.find(
      (u) =>
        u.codigoUbicacion === record.ubicacion || u.nombre === record.ubicacion
    );
    return (
      <Card
        key={record.codigoMaterial}
        size="small"
        style={{ marginBottom: 8 }}
        styles={{ body: { padding: 10 } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 12 }}>
              {record.codigoMaterial}
            </Text>
            <div style={{ fontSize: 13 }}>{record.descripcion}</div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <Tag color="default" style={{ margin: 0 }}>
                {ubi ? ubi.nombre || ubi.ubicacion : record.ubicacion || "N/A"}
              </Tag>
              <Tag color="volcano" style={{ margin: 0 }}>
                -{record.cantidad} uds
              </Tag>
            </div>
          </div>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => eliminarMaterial(record.codigoMaterial)}
          />
        </div>
      </Card>
    );
  };

  // 🎴 Card móvil de salida pendiente (con Collapse para detalles)
  const renderPendingSalidaCard = (s) => {
    const clienteNombre = (() => {
      if (!s.cliente) return "-";
      const c = clientes.find((cc) => cc.claveCliente === s.cliente);
      return c ? c.nombre || c.nombreFiscal : `ID: ${s.cliente}`;
    })();

    return (
      <Card
        key={s.noSalida}
        size="small"
        style={{ marginBottom: 10 }}
        styles={{ body: { padding: 12 } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text strong>#{s.noSalida}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {s.fecha ? new Date(s.fecha).toLocaleDateString() : "-"}
          </Text>
        </div>
        <div style={{ fontSize: 12, marginBottom: 2 }}>
          <Text type="secondary">Cotización: </Text>
          {s.cotizacion || "-"}
        </div>
        <div style={{ fontSize: 12, marginBottom: 2 }}>
          <Text type="secondary">Cliente: </Text>
          {clienteNombre}
        </div>
        <div style={{ fontSize: 12, marginBottom: 10 }}>
          <Text type="secondary">Solicitado por: </Text>
          <Tag icon={<UserOutlined />} style={{ margin: 0 }}>
            {s.usuarioSolicita || "Sistema"}
          </Tag>
        </div>

        <Space style={{ width: "100%" }} direction="horizontal">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => aprobarSalida(s.noSalida)}
            size="small"
            block
          >
            Aprobar
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => abrirModalRechazo(s.noSalida)}
            size="small"
            block
          >
            Rechazar
          </Button>
        </Space>

        <Collapse
          ghost
          size="small"
          style={{ marginTop: 8, background: "#fafafa", borderRadius: 6 }}
          onChange={(keys) => {
            if (keys.length > 0 && !detallesMateriales[s.noSalida]) {
              cargarDetalleSalida(true, s);
            }
          }}
          items={[
            {
              key: `detalle-${s.noSalida}`,
              label: (
                <Text style={{ fontSize: 12, color: "#1890ff" }}>
                  Ver materiales solicitados
                </Text>
              ),
              children: detallesMateriales[s.noSalida] ? (
                <div>
                  {detallesMateriales[s.noSalida].map((d) => (
                    <div
                      key={d.codigoMaterial}
                      style={{
                        padding: "6px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text strong style={{ fontSize: 12 }}>
                          {d.codigoMaterial}
                        </Text>
                        <Tag color="blue" style={{ margin: 0 }}>
                          {d.cantidad}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {d.descripcion}
                      </div>
                      <div style={{ fontSize: 11, color: "#999" }}>
                        Stock actual: {d.stockActual}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Cargando materiales...
                </Text>
              ),
            },
          ]}
        />
      </Card>
    );
  };

  return (
    <div
      style={{
        padding: isMobile ? "12px 8px" : "24px 16px",
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Card
        style={{
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        styles={{ body: { padding: isMobile ? "16px 12px" : "24px 16px" } }}
      >
        {/* ENCABEZADO */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: isMobile ? "16px" : "32px",
          }}
        >
          <div>
            <Title
              level={2}
              style={{
                margin: 0,
                color: "#fa8c16",
                fontSize: isMobile ? 20 : 24,
              }}
            >
              <ShoppingCartOutlined style={{ marginRight: 10 }} />
              Salida de Materiales
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
              Registra la salida de materiales del almacén
            </Text>
          </div>

          {user?.acceso === "ENC" && (
            <div style={{ alignSelf: isMobile ? "stretch" : "flex-start" }}>
              <Badge
                count={salidasPendientes.length}
                size="small"
                offset={[-10, 10]}
              >
                <Button
                  type="default"
                  icon={<ClockCircleOutlined />}
                  onClick={() => {
                    setModalVisible(true);
                    cargarSalidasPendientes();
                  }}
                  size="large"
                  block={isMobile}
                >
                  Salidas por Aprobar
                </Button>
              </Badge>
            </div>
          )}
        </div>

        {/* DATOS DE LA SALIDA */}
        <Card
          title="Datos de la Salida"
          style={{ marginBottom: 16 }}
          size={isMobile ? "small" : "default"}
          extra={
            <Space size="small">
              <Text style={{ fontSize: isMobile ? 11 : 14 }}>Alertar</Text>
              <Switch
                checked={alertarSalida}
                onChange={setAlertarSalida}
                size="small"
              />
            </Space>
          }
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Fecha" required style={{ margin: 0 }}>
                <DatePicker
                  value={fecha}
                  onChange={setFecha}
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Cotización" required style={{ margin: 0 }}>
                <Input
                  placeholder="Número de cotización"
                  value={cotizacion}
                  onChange={(e) => setCotizacion(e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Cliente" style={{ margin: 0 }}>
                <Select
                  showSearch
                  placeholder="Escribe o selecciona un cliente"
                  value={cliente}
                  onChange={setCliente}
                  optionFilterProp="children"
                  size="large"
                  style={{ width: "100%" }}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Space.Compact
                        style={{ width: "100%", padding: "0 8px 8px" }}
                      >
                        <Input
                          placeholder="Nuevo cliente"
                          value={nuevoCliente}
                          onChange={(e) => setNuevoCliente(e.target.value)}
                          onPressEnter={agregarNuevoCliente}
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
                >
                  {clientes.map((c) => (
                    <Option key={c.claveCliente} value={c.claveCliente}>
                      {c.nombre ||
                        c.nombreFiscal ||
                        `Cliente ${c.claveCliente}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* BÚSQUEDA Y SELECCIÓN */}
        <Row gutter={[12, 12]}>
          <Col xs={24} lg={12}>
            <Card
              title="Buscar Material"
              style={{ height: "100%" }}
              size={isMobile ? "small" : "default"}
            >
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col xs={12} sm={9}>
                  <Select
                    allowClear
                    placeholder="Ubicación"
                    style={{ width: "100%" }}
                    value={filtroUbicacion}
                    onChange={setFiltroUbicacion}
                  >
                    {ubicaciones.map((u, i) => {
                      const valor =
                        u.codigoUbicacion || u.codigo || u.id || u.clave || i;
                      const texto =
                        u.nombre ||
                        u.descripcion ||
                        u.ubicacion ||
                        `Ubicación ${valor}`;
                      return (
                        <Option key={valor} value={valor}>
                          {texto}
                        </Option>
                      );
                    })}
                  </Select>
                </Col>
                <Col xs={12} sm={9}>
                  <Select
                    allowClear
                    placeholder="Marca"
                    style={{ width: "100%" }}
                    value={filtroMarca}
                    onChange={setFiltroMarca}
                  >
                    {marcas.map((m, i) => {
                      const valor = m.claveMarca || m.codigo || m.id || i;
                      const texto =
                        m.nombre ||
                        m.descripcion ||
                        m.marca ||
                        `Marca ${valor}`;
                      return (
                        <Option key={valor} value={valor}>
                          {texto}
                        </Option>
                      );
                    })}
                  </Select>
                </Col>
                <Col xs={24} sm={6}>
                  <Button
                    onClick={() => {
                      setFiltroUbicacion(null);
                      setFiltroMarca(null);
                      setTextoBusqueda("");
                    }}
                    style={{ width: "100%" }}
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
                style={{ width: "100%", marginBottom: 16 }}
                size={isMobile ? "large" : "middle"}
              />

              {isMobile ? (
                buscandoMateriales ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <Text type="secondary">Buscando...</Text>
                  </div>
                ) : opcionesMateriales.length === 0 ? (
                  <Empty
                    description="Sin resultados"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <div>
                    {opcionesMateriales.map(renderMaterialBusquedaCard)}
                  </div>
                )
              ) : (
                <Table
                  dataSource={opcionesMateriales}
                  columns={columnasBusqueda}
                  rowKey="codigoMaterial"
                  size="small"
                  pagination={{ pageSize: 5, simple: isMobile }}
                  loading={buscandoMateriales}
                  scroll={{ x: 400 }}
                  bordered
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            {materialSeleccionado ? (
              <Card
                title="Material Seleccionado"
                style={{ height: "100%" }}
                size={isMobile ? "small" : "default"}
              >
                <Text
                  strong
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    display: "block",
                    marginBottom: 16,
                  }}
                >
                  {materialSeleccionado.codigoMaterial} -{" "}
                  {materialSeleccionado.descripcion}
                </Text>
                <Descriptions size="small" bordered column={1}>
                  <Descriptions.Item label="Stock Actual">
                    <Statistic
                      value={materialSeleccionado.stockActual}
                      valueStyle={{
                        fontSize: "14px",
                        color:
                          materialSeleccionado.stockActual <= 0
                            ? "red"
                            : "inherit",
                      }}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Ubicación">
                    <Tag color="blue">
                      <strong>{materialSeleccionado.ubicacion}</strong>
                    </Tag>
                  </Descriptions.Item>
                  {materialSeleccionado.marca && (
                    <Descriptions.Item label="Marca">
                      <Text>{materialSeleccionado.marca}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                <Divider />
                <Form.Item
                  label="Cantidad a Retirar *"
                  style={{ margin: 0 }}
                >
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      type="number"
                      placeholder="Ingresa cantidad"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      size="large"
                      onPressEnter={agregarMaterial}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={agregarMaterial}
                      disabled={!cantidad}
                      size="large"
                    >
                      Agregar
                    </Button>
                  </Space.Compact>
                </Form.Item>
              </Card>
            ) : (
              <Card
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fafafa",
                  minHeight: isMobile ? 140 : 200,
                }}
                size={isMobile ? "small" : "default"}
              >
                <div style={{ textAlign: "center", color: "#bfbfbf" }}>
                  <ShoppingCartOutlined
                    style={{ fontSize: isMobile ? 36 : 48, marginBottom: 12 }}
                  />
                  <p style={{ margin: 0, fontSize: isMobile ? 12 : 14 }}>
                    Selecciona un material de la tabla para agregarlo.
                  </p>
                </div>
              </Card>
            )}
          </Col>
        </Row>

        {/* LISTA FINAL */}
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              size={isMobile ? "small" : "default"}
              title={
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <Text>Materiales a Retirar</Text>
                  <Tag color="blue" style={{ margin: 0 }}>
                    {materiales.length} material(es)
                  </Tag>
                </div>
              }
              extra={
                !isMobile ? (
                  <div
                    style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                  >
                    <Button onClick={() => setMateriales([])} danger>
                      Vaciar Lista
                    </Button>
                    <Button
                      type="primary"
                      onClick={confirmarRegistro}
                      loading={loading}
                      disabled={materiales.length === 0}
                      icon={<ExclamationCircleOutlined />}
                    >
                      Registrar Salida
                    </Button>
                  </div>
                ) : null
              }
            >
              {isMobile && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 12,
                    flexDirection: "column",
                  }}
                >
                  <Button
                    type="primary"
                    block
                    onClick={confirmarRegistro}
                    loading={loading}
                    disabled={materiales.length === 0}
                    icon={<ExclamationCircleOutlined />}
                  >
                    Registrar Salida
                  </Button>
                  <Button
                    block
                    danger
                    onClick={() => setMateriales([])}
                    disabled={materiales.length === 0}
                  >
                    Vaciar Lista
                  </Button>
                </div>
              )}

              {materiales.length > 0 ? (
                isMobile ? (
                  <div>{materiales.map(renderMaterialSalidaCard)}</div>
                ) : (
                  <Table
                    dataSource={materiales}
                    columns={columnas}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 600 }}
                  />
                )
              ) : (
                <Empty
                  description="No hay materiales agregados."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: "20px 0" }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* MODAL CONFIRMAR */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            <span>Confirmar Registro</span>
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
        width={isMobile ? "92%" : 520}
      >
        <div style={{ padding: "10px 0" }}>
          <Text style={{ fontSize: isMobile ? 14 : 16 }}>
            ¿Estás segura de registrar la salida de{" "}
            <strong>{materiales.length} material(es)</strong>?
          </Text>
        </div>
      </Modal>

      {/* MODAL SALIDAS PENDIENTES */}
      <Modal
        title={
          <Space wrap>
            <ClockCircleOutlined />
            <span>Salidas por Aprobar</span>
            <Tag color="orange" style={{ margin: 0 }}>
              {salidasPendientes.length} pendientes
            </Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setModalVisible(false)}
            block={isMobile}
          >
            Cerrar
          </Button>,
        ]}
        width={isMobile ? "96%" : 1000}
        style={{ top: isMobile ? 16 : 100 }}
      >
        {isMobile ? (
          loadingSalidas ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <Text type="secondary">Cargando...</Text>
            </div>
          ) : salidasPendientes.length === 0 ? (
            <Empty
              description="No hay salidas pendientes"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div>
              {salidasPendientes.map(renderPendingSalidaCard)}
            </div>
          )
        ) : (
          <Table
            dataSource={salidasPendientes}
            columns={columnasSalidas}
            loading={loadingSalidas}
            rowKey="noSalida"
            pagination={{ pageSize: 5 }}
            size="middle"
            scroll={{ x: 800 }}
            expandable={{
              onExpand: cargarDetalleSalida,
              expandedRowRender: (record) => (
                <div
                  style={{
                    padding: 16,
                    backgroundColor: "#fafafa",
                    borderRadius: 8,
                  }}
                >
                  <Text
                    strong
                    style={{ display: "block", marginBottom: 12 }}
                  >
                    Materiales solicitados en esta salida:
                  </Text>
                  <Table
                    columns={columnasDetalleMateriales}
                    dataSource={detallesMateriales[record.noSalida] || []}
                    pagination={false}
                    size="small"
                    loading={
                      cargandoDetalles && !detallesMateriales[record.noSalida]
                    }
                    rowKey="codigoMaterial"
                    scroll={{ x: 400 }}
                  />
                </div>
              ),
            }}
            locale={{
              emptyText: (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <CheckCircleOutlined
                    style={{
                      fontSize: 32,
                      color: "#52c41a",
                      marginBottom: 8,
                    }}
                  />
                  <br />
                  <Text>No hay salidas pendientes de aprobación</Text>
                </div>
              ),
            }}
          />
        )}
      </Modal>

      {/* MODAL RECHAZO */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>Rechazar Salida #{salidaARechazar}</span>
          </Space>
        }
        open={modalRechazoVisible}
        onCancel={cerrarModalRechazo}
        footer={[
          <Button key="cancel" onClick={cerrarModalRechazo}>
            Cancelar
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            loading={rechazando}
            onClick={() => rechazarSalida(salidaARechazar)}
            icon={<CloseCircleOutlined />}
          >
            Rechazar Salida
          </Button>,
        ]}
        width={isMobile ? "92%" : 400}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CloseCircleOutlined
            style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }}
          />
          <Title level={4} style={{ marginBottom: 8 }}>
            ¿Rechazar esta salida?
          </Title>
          <Text type="secondary">
            Esta acción marcará la salida como rechazada. No se realizarán
            cambios en el inventario.
          </Text>
        </div>
      </Modal>
    </div>
  );
}