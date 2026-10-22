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

export default function EntradaMaterial() {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const [materiales, setMateriales] = useState([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [entradasPendientes, setEntradasPendientes] = useState([]);
  const [loadingEntradas, setLoadingEntradas] = useState(false);
  const [alertarEntrada, setAlertarEntrada] = useState(false);
  const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);

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
        const [
          clientesRes,
          proveedoresRes,
          categoriasRes,
          ubicacionesRes,
          marcasRes,
        ] = await Promise.all([
          api.get("/clientes"),
          api.get("/proveedores"),
          api.get("/categorias"),
          api.get("/ubicaciones"),
          api.get("/marcas"),
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
        nombreFiscal: nuevoCliente.trim(),
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
      const proveedorCreado = proveedoresRes.data.find(
        (p) => p.nombre === nuevoProveedor.trim()
      );
      if (proveedorCreado) setProveedor(proveedorCreado.codigo);
      setNuevoProveedor("");
    } catch (error) {
      message.error(
        error.response?.data?.message || "No se pudo agregar el proveedor"
      );
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
        const { data } = await api.get(
          `/entradas/${record.noEntrada}/materiales`
        );
        setDetallesMateriales((prev) => ({
          ...prev,
          [record.noEntrada]: data,
        }));
      } catch (error) {
        message.error(
          `Error al cargar los materiales de la entrada #${record.noEntrada}`
        );
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
    setMateriales([
      ...materiales,
      {
        ...materialSeleccionado,
        cantidad: parseFloat(cantidad),
        key: materialSeleccionado.codigoMaterial,
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
      message.error(
        "Faltan datos obligatorios: Asegúrate de llenar N° OS, Fecha y Proveedor."
      );
      return;
    }
    setModalConfirmacionVisible(true);
  };

  const registrarEntrada = async () => {
    const payload = {
      OS,
      fecha: fecha.format("YYYY-MM-DD"),
      proveedor,
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
      const { data } = await api.post("/entradas", payload);

      if (user?.acceso === "ENC") {
        message.success(
          `✅ Entrada #${data.noEntrada} registrada y APROBADA automáticamente.`
        );
      } else {
        message.success(
          `⏳ Entrada #${data.noEntrada} registrada. En espera de aprobación.`
        );
      }

      limpiarFormulario();
    } catch (error) {
      console.error("❌ Error detectado en la petición:", error);
      message.error(
        error.response?.data?.error || "Error de red al registrar entrada"
      );
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

  const columnasEntradas = [
    {
      title: "N° Entrada",
      dataIndex: "noEntrada",
      key: "noEntrada",
      width: 100,
    },
    { title: "OS", dataIndex: "OS", key: "OS", width: 120 },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (fecha) =>
        fecha ? new Date(fecha).toLocaleDateString() : "-",
    },
    {
      title: "Proveedor",
      dataIndex: "proveedorId",
      key: "proveedorId",
      render: (provId) => {
        if (!provId) return "-";
        const provEncontrado = proveedores.find((p) => p.codigo === provId);
        return provEncontrado ? provEncontrado.nombre : `Proveedor ${provId}`;
      },
    },
    {
      title: "Solicitado por",
      dataIndex: "nombreUsuario",
      key: "nombreUsuario",
      render: (usuario) =>
        usuario ? (
          <Tag icon={<UserOutlined />}>{usuario}</Tag>
        ) : (
          <Text type="secondary">Sistema</Text>
        ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => aprobarEntrada(record.noEntrada)}
            size="small"
          >
            Aprobar
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => abrirModalRechazo(record)}
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
      title: "Cantidad a Ingresar",
      dataIndex: "cantidad",
      key: "cantidad",
      render: (cant) => <Tag color="green">+{cant}</Tag>,
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
      title: "Cant. a Ingresar",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 150,
      align: "center",
      render: (cantidad) => (
        <Tag
          color="blue"
          style={{
            fontSize: "14px",
            padding: "4px 12px",
            borderRadius: "4px",
          }}
        >
          +{cantidad} uds
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

  // 🎴 Card móvil de material a ingresar
  const renderMaterialIngresoCard = (record) => {
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
              style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}
            >
              <Tag color="default" style={{ margin: 0 }}>
                {ubi ? ubi.nombre || ubi.ubicacion : record.ubicacion || "N/A"}
              </Tag>
              <Tag color="blue" style={{ margin: 0 }}>
                +{record.cantidad} uds
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

  // 🎴 Card móvil de entrada pendiente (con Collapse para detalles)
  const renderPendingEntryCard = (e) => {
    const provNombre = (() => {
      const p = proveedores.find((pp) => pp.codigo === e.proveedorId);
      return p ? p.nombre : e.proveedorId || "-";
    })();

    return (
      <Card
        key={e.noEntrada}
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
          <Text strong>#{e.noEntrada}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {e.fecha ? new Date(e.fecha).toLocaleDateString() : "-"}
          </Text>
        </div>
        <div style={{ fontSize: 12, marginBottom: 2 }}>
          <Text type="secondary">OS: </Text>
          {e.OS}
        </div>
        <div style={{ fontSize: 12, marginBottom: 2 }}>
          <Text type="secondary">Proveedor: </Text>
          {provNombre}
        </div>
        <div style={{ fontSize: 12, marginBottom: 10 }}>
          <Text type="secondary">Solicitado por: </Text>
          <Tag icon={<UserOutlined />} style={{ margin: 0 }}>
            {e.nombreUsuario || "Sistema"}
          </Tag>
        </div>

        <Space style={{ width: "100%" }} direction="horizontal">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => aprobarEntrada(e.noEntrada)}
            size="small"
            block
          >
            Aprobar
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => abrirModalRechazo(e)}
            size="small"
            block
          >
            Rechazar
          </Button>
        </Space>

        <Collapse
          ghost
          size="small"
          style={{ marginTop: 8, background: "#f6ffed", borderRadius: 6 }}
          onChange={(keys) => {
            if (keys.length > 0 && !detallesMateriales[e.noEntrada]) {
              cargarDetalleEntrada(true, e);
            }
          }}
          items={[
            {
              key: `detalle-${e.noEntrada}`,
              label: (
                <Text style={{ fontSize: 12, color: "#389e0d" }}>
                  Ver materiales a ingresar
                </Text>
              ),
              children: detallesMateriales[e.noEntrada] ? (
                <div>
                  {detallesMateriales[e.noEntrada].map((d) => (
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
                        <Tag color="green" style={{ margin: 0 }}>
                          +{d.cantidad}
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
                color: "#1890ff",
                fontSize: isMobile ? 20 : 24,
              }}
            >
              <ShoppingCartOutlined style={{ marginRight: 10 }} />
              Entrada de Materiales
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
              Registra la entrada de materiales al almacén
            </Text>
          </div>
          {user?.acceso === "ENC" && (
            <div style={{ alignSelf: isMobile ? "stretch" : "flex-start" }}>
              <Badge
                count={entradasPendientes.length}
                size="small"
                offset={[-10, 10]}
              >
                <Button
                  type="default"
                  icon={<ClockCircleOutlined />}
                  onClick={() => {
                    setModalVisible(true);
                    cargarEntradasPendientes();
                  }}
                  size="large"
                  block={isMobile}
                >
                  Entradas por Aprobar
                </Button>
              </Badge>
            </div>
          )}
        </div>

        {/* DATOS DE LA ENTRADA */}
        <Card
          title="Datos de la Entrada"
          style={{ marginBottom: 16 }}
          size={isMobile ? "small" : "default"}
          extra={
            <Space size="small">
              <Text style={{ fontSize: isMobile ? 11 : 14 }}>Alertar</Text>
              <Switch
                checked={alertarEntrada}
                onChange={setAlertarEntrada}
                size="small"
              />
            </Space>
          }
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item label="N° OS" required style={{ margin: 0 }}>
                <Input
                  placeholder="Número de OS"
                  value={OS}
                  onChange={(e) => setOS(e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
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
            <Col xs={24} sm={12} lg={6}>
              <Form.Item label="Proveedor" required style={{ margin: 0 }}>
                <Select
                  showSearch
                  placeholder="Escribe o selecciona"
                  value={proveedor}
                  onChange={setProveedor}
                  optionFilterProp="children"
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Space.Compact
                        style={{ width: "100%", padding: "0 8px 8px" }}
                      >
                        <Input
                          placeholder="Nuevo proveedor"
                          value={nuevoProveedor}
                          onChange={(e) => setNuevoProveedor(e.target.value)}
                          onPressEnter={agregarNuevoProveedor}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={agregarNuevoProveedor}
                          loading={cargandoProveedores}
                        />
                      </Space.Compact>
                    </>
                  )}
                  size="large"
                  style={{ width: "100%" }}
                >
                  {proveedores.map((p) => (
                    <Option key={p.codigo} value={p.codigo}>
                      {p.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item label="Cliente (opcional)" style={{ margin: 0 }}>
                <Select
                  showSearch
                  placeholder="Escribe o selecciona"
                  value={cliente}
                  onChange={setCliente}
                  optionFilterProp="children"
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
                        />
                      </Space.Compact>
                    </>
                  )}
                  size="large"
                  style={{ width: "100%" }}
                >
                  {clientes.map((c) => (
                    <Option key={c.claveCliente} value={c.claveCliente}>
                      {c.nombreFiscal || `Cliente ${c.claveCliente}`}
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
                  <div>{opcionesMateriales.map(renderMaterialBusquedaCard)}</div>
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
                      valueStyle={{ fontSize: "14px" }}
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
                  label="Cantidad a Ingresar *"
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
                  <Text>Materiales a Ingresar</Text>
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
                      Registrar Entrada
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
                    Registrar Entrada
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
                  <div>{materiales.map(renderMaterialIngresoCard)}</div>
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
          await registrarEntrada();
        }}
        onCancel={() => setModalConfirmacionVisible(false)}
        okText="Sí, registrar"
        cancelText="Cancelar"
        confirmLoading={loading}
        width={isMobile ? "92%" : 520}
      >
        <div style={{ padding: "10px 0" }}>
          <Text style={{ fontSize: isMobile ? 14 : 16 }}>
            ¿Estás segura de registrar la entrada de{" "}
            <strong>{materiales.length} material(es)</strong>?
          </Text>
        </div>
      </Modal>

      {/* MODAL ENTRADAS PENDIENTES */}
      <Modal
        title={
          <Space wrap>
            <ClockCircleOutlined />
            <span>Entradas por Aprobar</span>
            <Tag color="orange" style={{ margin: 0 }}>
              {entradasPendientes.length} pendientes
            </Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)} block={isMobile}>
            Cerrar
          </Button>,
        ]}
        width={isMobile ? "96%" : 1000}
        style={{ top: isMobile ? 16 : 100 }}
      >
        {isMobile ? (
          loadingEntradas ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <Text type="secondary">Cargando...</Text>
            </div>
          ) : entradasPendientes.length === 0 ? (
            <Empty
              description="No hay entradas pendientes"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div>
              {entradasPendientes.map(renderPendingEntryCard)}
            </div>
          )
        ) : (
          <Table
            dataSource={entradasPendientes}
            columns={columnasEntradas}
            loading={loadingEntradas}
            rowKey="noEntrada"
            pagination={{ pageSize: 5 }}
            size="middle"
            scroll={{ x: 800 }}
            expandable={{
              onExpand: cargarDetalleEntrada,
              expandedRowRender: (record) => (
                <div
                  style={{
                    padding: 16,
                    backgroundColor: "#f6ffed",
                    borderRadius: 8,
                  }}
                >
                  <Text
                    strong
                    style={{
                      display: "block",
                      marginBottom: 12,
                      color: "#389e0d",
                    }}
                  >
                    Materiales a ingresar:
                  </Text>
                  <Table
                    columns={columnasDetalleMateriales}
                    dataSource={detallesMateriales[record.noEntrada] || []}
                    pagination={false}
                    size="small"
                    loading={
                      cargandoDetalles && !detallesMateriales[record.noEntrada]
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
                    style={{ fontSize: 48, color: "#52c41a", marginBottom: 16 }}
                  />
                  <br />
                  <Text type="success">
                    No hay entradas pendientes de aprobación
                  </Text>
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
            <span>Rechazar Entrada #{entradaSeleccionada?.noEntrada}</span>
          </Space>
        }
        open={modalRechazoVisible}
        onCancel={() => {
          setModalRechazoVisible(false);
          setEntradaSeleccionada(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setModalRechazoVisible(false);
              setEntradaSeleccionada(null);
            }}
          >
            Cancelar
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            loading={rechazando}
            onClick={() => rechazarEntrada(entradaSeleccionada?.noEntrada)}
            icon={<CloseCircleOutlined />}
          >
            Rechazar Entrada
          </Button>,
        ]}
        width={isMobile ? "92%" : 400}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CloseCircleOutlined
            style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }}
          />
          <Title level={4} style={{ marginBottom: 8 }}>
            ¿Rechazar esta entrada?
          </Title>
          <Text type="secondary">
            Esta acción marcará la entrada como rechazada. No se sumará stock al
            inventario.
          </Text>
        </div>
      </Modal>
    </div>
  );
}