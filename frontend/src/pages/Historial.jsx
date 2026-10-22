import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Statistic,
  Button,
  message,
  Modal,
  Grid,
  Empty,
} from "antd";
import {
  ReloadOutlined,
  FileTextOutlined,
  InboxOutlined,
  UploadOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const HistorialMovimientos = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const [movimientos, setMovimientos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [rangoFechas, setRangoFechas] = useState([]);
  const [resumen, setResumen] = useState({
    totalMovimientos: 0,
    totalEntradas: 0,
    totalSalidas: 0,
  });
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detalleMateriales, setDetalleMateriales] = useState([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);

  useEffect(() => {
    obtenerResumen();
    obtenerMovimientos();
  }, []);

  const obtenerResumen = async () => {
    try {
      const response = await api.get("/historial/totales");
      let totals = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      setResumen({
        totalMovimientos: totals?.totalMovimientos || 0,
        totalEntradas: totals?.totalEntradas || 0,
        totalSalidas: totals?.totalSalidas || 0,
      });
    } catch (error) {
      console.error("❌ Error al obtener totales:", error);
      message.error("No se pudo obtener el resumen de movimientos");
    }
  };

  const obtenerMovimientos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (busqueda) params.search = busqueda;
      if (filtroTipo !== "Todos") params.tipo = filtroTipo;
      if (rangoFechas && rangoFechas.length === 2) {
        params.fechaInicio = rangoFechas[0].format("YYYY-MM-DD");
        params.fechaFin = rangoFechas[1].format("YYYY-MM-DD");
      }

      const response = await api.get("/historial", { params });
      setMovimientos(response.data);
    } catch (error) {
      console.error("❌ Error al obtener movimientos:", error);
      message.error("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = async (record) => {
    setMovimientoSeleccionado(record);
    setIsModalVisible(true);
    setLoadingDetalles(true);

    try {
      const idNumber = String(record.idReferencia).replace(/\D/g, "");
      const endpoint =
        record.modulo === "Entradas"
          ? `/entradas/${idNumber}/materiales`
          : `/salidas/${idNumber}/materiales`;

      const response = await api.get(endpoint);
      setDetalleMateriales(response.data);
    } catch (error) {
      console.error("❌ Error al cargar detalles:", error);
      message.error("No se pudieron cargar los materiales de este movimiento.");
    } finally {
      setLoadingDetalles(false);
    }
  };

  const aplicarFiltros = () => obtenerMovimientos();

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("Todos");
    setRangoFechas([]);
    obtenerMovimientos();
  };

  const columnas = [
    {
      title: "Fecha y Hora",
      dataIndex: "fecha",
      key: "fecha",
      width: 150,
      render: (fecha) => {
        if (!fecha) return "-";
        if (fecha.includes("T00:00:00.000Z") || fecha.length === 10) {
          const [year, month, day] = fecha.substring(0, 10).split("-");
          return `${day}/${month}/${year}`;
        }
        return dayjs(fecha).format("DD/MM/YYYY HH:mm");
      },
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
    },
    {
      title: "Módulo",
      dataIndex: "modulo",
      key: "modulo",
      width: 120,
      render: (modulo) => {
        let color = "default";
        if (modulo === "Entradas") color = "green";
        if (modulo === "Salidas") color = "red";
        if (modulo === "Usuarios" || modulo === "Login") color = "blue";
        return <Tag color={color}>{modulo.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Referencia",
      dataIndex: "idReferencia",
      key: "idReferencia",
      width: 120,
      render: (ref) => (
        <Text strong type="secondary">
          {ref}
        </Text>
      ),
    },
    {
      title: "Usuario",
      dataIndex: "nombreUsuario",
      key: "usuario",
      render: (nombre) =>
        nombre ? (
          <Space>
            <UserOutlined style={{ color: "#1890ff" }} />
            <Text strong>{nombre}</Text>
          </Space>
        ) : (
          <Text type="secondary">Sistema</Text>
        ),
    },
    {
      title: "Acción Realizada",
      dataIndex: "accion",
      key: "accion",
      width: 250,
    },
    {
      title: "Detalles",
      dataIndex: "detalle",
      key: "detalle",
      ellipsis: true,
      render: (detalle) => <Text type="secondary">{detalle}</Text>,
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 100,
      fixed: "right",
      render: (_, record) =>
        (record.modulo === "Entradas" || record.modulo === "Salidas") && (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => verDetalles(record)}
          >
            Ver
          </Button>
        ),
    },
  ];

  // 🔁 Helper de fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    if (fecha.includes("T00:00:00.000Z") || fecha.length === 10) {
      const [year, month, day] = fecha.substring(0, 10).split("-");
      return `${day}/${month}/${year}`;
    }
    return dayjs(fecha).format("DD/MM/YYYY HH:mm");
  };

  const getModuloColor = (modulo) => {
    if (modulo === "Entradas") return "green";
    if (modulo === "Salidas") return "red";
    if (modulo === "Usuarios" || modulo === "Login") return "blue";
    return "default";
  };

  // 🎴 Card móvil de un movimiento
  const renderMovimientoCard = (record, index) => {
    const puedeVerDetalle =
      record.modulo === "Entradas" || record.modulo === "Salidas";

    return (
      <div
        key={`${record.idReferencia}-${record.accion}-${index}`}
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: 10,
          padding: 12,
          marginBottom: 10,
          background: "#fff",
        }}
      >
        {/* Header: fecha + módulo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            {formatearFecha(record.fecha)}
          </Text>
          <Tag
            color={getModuloColor(record.modulo)}
            style={{ margin: 0, flexShrink: 0 }}
          >
            {record.modulo?.toUpperCase()}
          </Tag>
        </div>

        {/* Referencia */}
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
          Ref:{" "}
          <Text strong type="secondary" style={{ fontSize: 12 }}>
            {record.idReferencia}
          </Text>
        </div>

        {/* Acción realizada */}
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
          {record.accion}
        </div>

        {/* Detalle */}
        {record.detalle && (
          <div
            style={{
              fontSize: 12,
              color: "#666",
              marginBottom: 8,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {record.detalle}
          </div>
        )}

        {/* Usuario + botón Ver */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            paddingTop: 8,
            borderTop: "1px solid #f0f0f0",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {record.nombreUsuario ? (
              <Space size={4}>
                <UserOutlined style={{ color: "#1890ff", fontSize: 12 }} />
                <Text strong style={{ fontSize: 12 }} ellipsis>
                  {record.nombreUsuario}
                </Text>
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Sistema
              </Text>
            )}
          </div>
          {puedeVerDetalle && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => verDetalles(record)}
              style={{ padding: 0 }}
            >
              Ver
            </Button>
          )}
        </div>
      </div>
    );
  };

  // 🎴 Card móvil de detalle en el modal
  const renderDetalleCard = (item) => (
    <div
      key={item.codigoMaterial}
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <Text strong style={{ fontSize: 12 }}>
          {item.codigoMaterial}
        </Text>
        <Tag
          color={
            movimientoSeleccionado?.modulo === "Entradas" ? "green" : "red"
          }
          style={{ margin: 0, flexShrink: 0 }}
        >
          {movimientoSeleccionado?.modulo === "Entradas" ? "+" : "-"}
          {item.cantidad}
        </Tag>
      </div>
      <div style={{ fontSize: 13, color: "#333" }}>{item.descripcion}</div>
    </div>
  );

  return (
    <div
      style={{
        padding: isMobile ? "12px 8px" : "24px 16px",
        background: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Title
          level={2}
          style={{ margin: 0, fontSize: isMobile ? 20 : 24 }}
        >
          <FileTextOutlined style={{ marginRight: 8 }} />
          Auditoría e Historial
        </Title>
        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
          Registro completo de movimientos de inventario y actividad del
          sistema.
        </Text>
      </div>

      {/* Stats: 3 en fila en móvil */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, height: "100%" }}
            styles={{ body: { padding: isMobile ? 10 : 24 } }}
          >
            <Statistic
              title={
                <span style={{ fontSize: isMobile ? 11 : 14 }}>
                  Total Movimientos
                </span>
              }
              value={resumen.totalMovimientos}
              prefix={
                <FileTextOutlined
                  style={{ fontSize: isMobile ? 14 : 16 }}
                />
              }
              valueStyle={{
                color: "#1890ff",
                fontSize: isMobile ? 16 : 24,
              }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, height: "100%" }}
            styles={{ body: { padding: isMobile ? 10 : 24 } }}
          >
            <Statistic
              title={
                <span style={{ fontSize: isMobile ? 11 : 14 }}>Entradas</span>
              }
              value={resumen.totalEntradas}
              prefix={
                <InboxOutlined style={{ fontSize: isMobile ? 14 : 16 }} />
              }
              valueStyle={{
                color: "#52c41a",
                fontSize: isMobile ? 16 : 24,
              }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, height: "100%" }}
            styles={{ body: { padding: isMobile ? 10 : 24 } }}
          >
            <Statistic
              title={
                <span style={{ fontSize: isMobile ? 11 : 14 }}>Salidas</span>
              }
              value={resumen.totalSalidas}
              prefix={
                <UploadOutlined style={{ fontSize: isMobile ? 14 : 16 }} />
              }
              valueStyle={{
                color: "#ff4d4f",
                fontSize: isMobile ? 16 : 24,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card
        style={{ marginBottom: isMobile ? 16 : 24, borderRadius: 8 }}
        size={isMobile ? "small" : "default"}
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="bottom">
          <Col xs={24} lg={6}>
            {!isMobile && (
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Buscar:
              </Text>
            )}
            <Input
              placeholder="Referencia, usuario o acción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onPressEnter={aplicarFiltros}
              size={isMobile ? "large" : "middle"}
              allowClear
            />
          </Col>
          <Col xs={12} sm={12} lg={5}>
            {!isMobile && (
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Módulo:
              </Text>
            )}
            <Select
              value={filtroTipo}
              onChange={setFiltroTipo}
              style={{ width: "100%" }}
              size={isMobile ? "large" : "middle"}
            >
              <Option value="Todos">Todos</Option>
              <Option value="Entradas">Entradas</Option>
              <Option value="Salidas">Salidas</Option>
              <Option value="Usuarios">Usuarios</Option>
              <Option value="Login">Login</Option>
            </Select>
          </Col>
          <Col xs={12} sm={12} lg={7}>
            {!isMobile && (
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Rango de fechas:
              </Text>
            )}
            <RangePicker
              value={rangoFechas}
              onChange={setRangoFechas}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              size={isMobile ? "large" : "middle"}
            />
          </Col>
          <Col xs={24} lg={6}>
            <Space
              style={{
                width: "100%",
                justifyContent: isMobile ? "stretch" : "flex-end",
                display: "flex",
              }}
            >
              <Button
                onClick={limpiarFiltros}
                disabled={loading}
                block={isMobile}
                size={isMobile ? "large" : "middle"}
                style={{ flex: isMobile ? 1 : undefined }}
              >
                Limpiar
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={aplicarFiltros}
                loading={loading}
                block={isMobile}
                size={isMobile ? "large" : "middle"}
                style={{ flex: isMobile ? 1 : undefined }}
              >
                Filtrar
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Listado */}
      <Card
        style={{ borderRadius: 8 }}
        size={isMobile ? "small" : "default"}
        title={
          <Space size={6} wrap>
            <Text>Registro de Actividad</Text>
            <Tag color="blue" style={{ margin: 0 }}>
              {movimientos.length} registros
            </Tag>
          </Space>
        }
        extra={
          !isMobile && (
            <Button
              icon={<ReloadOutlined />}
              onClick={limpiarFiltros}
              loading={loading}
            >
              Actualizar
            </Button>
          )
        }
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        {isMobile && (
          <Button
            icon={<ReloadOutlined />}
            onClick={limpiarFiltros}
            loading={loading}
            block
            size="large"
            style={{ marginBottom: 12 }}
          >
            Actualizar
          </Button>
        )}

        {isMobile ? (
          loading ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <Text type="secondary">Cargando...</Text>
            </div>
          ) : movimientos.length === 0 ? (
            <Empty description="Sin movimientos" />
          ) : (
            <div>
              {movimientos.map((m, i) => renderMovimientoCard(m, i))}
            </div>
          )
        ) : (
          <Table
            columns={columnas}
            dataSource={movimientos}
            rowKey={(record) => `${record.idReferencia}-${record.accion}`}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            bordered
          />
        )}
      </Card>

      {/* Modal detalle */}
      <Modal
        title={
          <Space size={6} wrap>
            {movimientoSeleccionado?.modulo === "Entradas" ? (
              <InboxOutlined style={{ color: "#52c41a" }} />
            ) : (
              <UploadOutlined style={{ color: "#ff4d4f" }} />
            )}
            <Text strong>Detalle de {movimientoSeleccionado?.modulo}</Text>
            <Tag color="default" style={{ margin: 0 }}>
              Folio: {movimientoSeleccionado?.idReferencia}
            </Tag>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="cerrar"
            type="primary"
            onClick={() => setIsModalVisible(false)}
            block={isMobile}
          >
            Cerrar
          </Button>,
        ]}
        width={isMobile ? "95%" : 700}
        style={{ top: isMobile ? 16 : 100 }}
      >
        {isMobile ? (
          loadingDetalles ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <Text type="secondary">Cargando materiales...</Text>
            </div>
          ) : detalleMateriales.length === 0 ? (
            <Empty
              description="Sin materiales registrados"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  marginBottom: 8,
                }}
              >
                {detalleMateriales.length} material(es):
              </div>
              {detalleMateriales.map(renderDetalleCard)}
            </div>
          )
        ) : (
          <Table
            dataSource={detalleMateriales}
            loading={loadingDetalles}
            rowKey="codigoMaterial"
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 500 }}
            columns={[
              {
                title: "Código",
                dataIndex: "codigoMaterial",
                key: "codigo",
                width: 120,
              },
              {
                title: "Descripción",
                dataIndex: "descripcion",
                key: "descripcion",
              },
              {
                title: "Cantidad Movida",
                dataIndex: "cantidad",
                key: "cantidad",
                width: 150,
                align: "center",
                render: (cantidad) => (
                  <Tag
                    color={
                      movimientoSeleccionado?.modulo === "Entradas"
                        ? "green"
                        : "red"
                    }
                    style={{ fontSize: 14, padding: "4px 8px" }}
                  >
                    {movimientoSeleccionado?.modulo === "Entradas" ? "+" : "-"}
                    {cantidad}
                  </Tag>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default HistorialMovimientos;