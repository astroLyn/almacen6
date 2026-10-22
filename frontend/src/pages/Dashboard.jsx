import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Badge,
  Avatar,
  Spin,
  Alert,
  Table,
  Tag,
  Grid,
  Empty,
  Progress,
} from "antd";
import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../api/axiosConfig";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#84CC16", "#F97316",
];
const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  useEffect(() => {
    const obtenerDatosDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get("/dashboard");
        setDashboardData(response.data);
      } catch (err) {
        console.error("❌ Error al obtener datos del dashboard:", err);
        setError("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };
    obtenerDatosDashboard();
  }, []);

  const formatearMovimientosSemanales = (movimientos) => {
    if (!movimientos || !Array.isArray(movimientos)) return [];
    return movimientos.map((item) => ({
      name: DIAS_SEMANA[new Date(item.dia).getDay()] || "Sin nombre",
      Entradas: parseInt(item.entradas) || 0,
      Salidas: parseInt(item.salidas) || 0,
      fechaOriginal: item.dia,
    }));
  };

  const formatearStockTabla = (stockData) => {
    if (!stockData || !Array.isArray(stockData)) return [];
    const totalStock = stockData.reduce(
      (sum, item) => sum + parseFloat(item.stock || 0),
      0
    );
    return stockData.map((item, index) => {
      const cantidad = parseFloat(item.stock || 0);
      const porcentaje = totalStock > 0 ? (cantidad / totalStock) * 100 : 0;
      return {
        key: index,
        categoria: item.categoria || "Sin categoría",
        cantidad,
        porcentaje,
        color: COLORS[index % COLORS.length],
      };
    });
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin size="large" tip="Cargando dashboard..." />
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ margin: isMobile ? "56px 10px 20px" : "20px" }}>
          <Alert message={error} type="error" showIcon />
        </Content>
      </Layout>
    );
  }

  const {
    totalesMateriales = {},
    alertas = {},
    aprobacionesPendientes = {},
    movimientosHoy = {},
    movimientosSemanales = [],
    stockPorCategoria = [],
  } = dashboardData || {};

  const datosMovimientosSemanales =
    formatearMovimientosSemanales(movimientosSemanales);
  const datosStockTabla = formatearStockTabla(stockPorCategoria);
  const totalCantidad = datosStockTabla.reduce(
    (sum, item) => sum + item.cantidad,
    0
  );

  // 🖥️ Columnas de la tabla (solo Desktop)
  const columnasStock = [
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      fixed: "left",
      width: 120,
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: record.color,
              borderRadius: "50%",
              marginRight: 8,
            }}
          />
          {text}
        </div>
      ),
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 120,
      render: (cantidad) => (
        <Text strong>{cantidad.toLocaleString()} unidades</Text>
      ),
      sorter: (a, b) => a.cantidad - b.cantidad,
    },
    {
      title: "Porcentaje",
      dataIndex: "porcentaje",
      key: "porcentaje",
      width: 100,
      render: (porcentaje) => (
        <Tag
          color={
            porcentaje > 20 ? "green" : porcentaje > 10 ? "orange" : "red"
          }
        >
          {porcentaje ? `${porcentaje.toFixed(1)}%` : "0%"}
        </Tag>
      ),
      sorter: (a, b) => a.porcentaje - b.porcentaje,
    },
    {
      title: "Distribución",
      key: "distribucion",
      width: 150,
      render: (_, record) => (
        <div
          style={{ width: "100%", backgroundColor: "#f0f0f0", borderRadius: 4 }}
        >
          <div
            style={{
              width: `${Math.min(record.porcentaje, 100)}%`,
              height: 8,
              backgroundColor: record.color,
              borderRadius: 4,
            }}
          />
        </div>
      ),
    },
  ];

  // 🔢 StatCard reutilizable (compacta en móvil)
  const StatCard = ({ icon, color, label, value, extra }) => (
    <Card
      size="small"
      style={{ height: "100%" }}
      styles={{ body: { padding: isMobile ? 10 : 16 } }}
    >
      <Row align="middle" gutter={isMobile ? 6 : 8} wrap={false}>
        <Col flex="none">
          <span style={{ fontSize: isMobile ? 18 : 24, color, display: "flex" }}>
            {icon}
          </span>
        </Col>
        <Col flex="auto" style={{ minWidth: 0 }}>
          <Text
            strong
            ellipsis
            style={{ display: "block", fontSize: isMobile ? 10 : 12 }}
            title={label}
          >
            {label}
          </Text>
          <Title
            level={3}
            style={{
              margin: "2px 0",
              fontSize: isMobile ? 17 : 20,
              color: ["#EF4444", "#F59E0B", "#8B5CF6"].includes(color)
                ? color
                : undefined,
            }}
          >
            {value}
          </Title>
          {extra && (
            <Text
              type="secondary"
              style={{ fontSize: isMobile ? 9 : 11, display: "block" }}
              ellipsis
              title={typeof extra === "string" ? extra : undefined}
            >
              {extra}
            </Text>
          )}
        </Col>
      </Row>
    </Card>
  );

  // 📱 Render móvil de la distribución de stock (cards + progress)
  const renderStockMobile = () => {
    if (!datosStockTabla.length) {
      return <Empty description="No hay datos de stock" />;
    }
    return (
      <div>
        {datosStockTabla.map((item) => (
          <div
            key={item.key}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: item.color,
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
                <Text
                  strong
                  ellipsis
                  style={{ fontSize: 13 }}
                  title={item.categoria}
                >
                  {item.categoria}
                </Text>
              </div>
              <Tag
                color={
                  item.porcentaje > 20
                    ? "green"
                    : item.porcentaje > 10
                    ? "orange"
                    : "red"
                }
                style={{ margin: 0, flexShrink: 0 }}
              >
                {item.porcentaje ? `${item.porcentaje.toFixed(1)}%` : "0%"}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
              {item.cantidad.toLocaleString()} unidades
            </div>
            <Progress
              percent={Math.min(item.porcentaje, 100)}
              showInfo={false}
              strokeColor={item.color}
              size="small"
            />
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 12,
            fontSize: 13,
          }}
        >
          <Text strong>Total</Text>
          <Text strong>
            {totalCantidad.toLocaleString()} uds · 100%
          </Text>
        </div>
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        {/* 📱 paddingLeft en móvil deja espacio al botón hamburguesa flotante del sidebar */}
        <Header
          style={{
            background: "#fff",
            padding: isMobile ? "12px 16px 12px 56px" : "16px 24px",
            borderBottom: "1px solid #f0f0f0",
            height: "auto",
            lineHeight: "normal",
          }}
        >
          <Row align="middle" justify="space-between" gutter={8}>
            <Col flex="auto" style={{ minWidth: 0 }}>
              <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                Dashboard
              </Title>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "12px" : "14px" }}
              >
                Resumen general del almacén
              </Text>
            </Col>
            <Col flex="none">
              <Badge count={alertas.alertasActivas || 0}>
                <Avatar
                  icon={<ExclamationCircleOutlined />}
                  style={{ backgroundColor: "#ff4d4f" }}
                />
              </Badge>
            </Col>
          </Row>
        </Header>

        <Content style={{ margin: isMobile ? "10px" : "20px", padding: 0 }}>
          {/* Stats: 2x2x2 en móvil → 3x2 en tablet → 6x1 en desktop */}
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            <Col xs={12} sm={8} md={8} lg={4}>
              <StatCard
                icon={<DatabaseOutlined />}
                color="#3B82F6"
                label="Total Materiales"
                value={totalesMateriales.totalMateriales || 0}
                extra={
                  <>
                    <ArrowUpOutlined /> Materiales en sistema
                  </>
                }
              />
            </Col>
            <Col xs={12} sm={8} md={8} lg={4}>
              <StatCard
                icon={<BarChartOutlined />}
                color="#10B981"
                label="Stock Total"
                value={parseFloat(
                  totalesMateriales.stockTotal || 0
                ).toLocaleString()}
                extra={`${parseFloat(
                  totalesMateriales.totalReservado || 0
                ).toLocaleString()} reservados`}
              />
            </Col>
            <Col xs={12} sm={8} md={8} lg={4}>
              <StatCard
                icon={<ExclamationCircleOutlined />}
                color="#EF4444"
                label="Alertas Activas"
                value={alertas.alertasActivas || 0}
                extra="⚠️ Stock bajo mínimo"
              />
            </Col>
            <Col xs={12} sm={12} md={8} lg={4}>
              <StatCard
                icon={<ClockCircleOutlined />}
                color="#F59E0B"
                label="Entradas por Aprobar"
                value={aprobacionesPendientes.entradasPorAprobar || 0}
                extra="⏳ Esperando revisión"
              />
            </Col>
            <Col xs={12} sm={12} md={8} lg={4}>
              <StatCard
                icon={<CheckCircleOutlined />}
                color="#8B5CF6"
                label="Salidas por Aprobar"
                value={aprobacionesPendientes.salidasPorAprobar || 0}
                extra="📋 Pendientes"
              />
            </Col>
            <Col xs={12} sm={12} md={8} lg={4}>
              <StatCard
                icon={<AppstoreOutlined />}
                color="#06B6D4"
                label="Movimientos Hoy"
                value={movimientosHoy.totalHoy || 0}
                extra={`↑ ${movimientosHoy.entradasHoy || 0} ent, ${
                  movimientosHoy.salidasHoy || 0
                } sal`}
              />
            </Col>
          </Row>

          <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginTop: isMobile ? 12 : 20 }}>
            {/* Gráfico de movimientos */}
            <Col xs={24} lg={12}>
              <Card
                title="Movimientos de la Semana"
                size="small"
                style={{ height: isMobile ? "auto" : "400px" }}
              >
                {datosMovimientosSemanales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
                    <BarChart
                      data={datosMovimientosSemanales}
                      margin={{
                        top: 20,
                        right: 10,
                        left: isMobile ? -25 : -20,
                        bottom: 5,
                      }}
                    >
                      {/* 📱 En móvil: sin rotación, abreviado a 3 letras, altura chica */}
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: isMobile ? 10 : 10 }}
                        interval={0}
                        angle={isMobile ? 0 : -45}
                        textAnchor={isMobile ? "middle" : "end"}
                        height={isMobile ? 30 : 60}
                        tickFormatter={(val) =>
                          isMobile ? String(val).slice(0, 3) : val
                        }
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value, name) => [`${value} mov.`, name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 12 }} />
                      <Bar
                        dataKey="Entradas"
                        fill="#10B981"
                        name="Entradas"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Salidas"
                        fill="#EF4444"
                        name="Salidas"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: isMobile ? 240 : 300,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                    }}
                  >
                    No hay datos de movimientos
                  </div>
                )}
              </Card>
            </Col>

            {/* Distribución de stock: cards en móvil / tabla en desktop */}
            <Col xs={24} lg={12}>
              <Card
                title="Distribución de Stock"
                size="small"
                style={{ height: isMobile ? "auto" : "400px" }}
              >
                {datosStockTabla.length > 0 ? (
                  isMobile ? (
                    renderStockMobile()
                  ) : (
                    <Table
                      dataSource={datosStockTabla}
                      columns={columnasStock}
                      pagination={false}
                      size="small"
                      scroll={{ x: 500, y: 240 }}
                      summary={() => (
                        <Table.Summary>
                          <Table.Summary.Row style={{ background: "#fafafa" }}>
                            <Table.Summary.Cell index={0}>
                              <Text strong>Total</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <Text strong>
                                {totalCantidad.toLocaleString()} uds
                              </Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2}>
                              <Text strong>100%</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} />
                          </Table.Summary.Row>
                        </Table.Summary>
                      )}
                    />
                  )
                ) : (
                  <div
                    style={{
                      height: isMobile ? 220 : 300,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                    }}
                  >
                    No hay datos de stock
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {(!dashboardData || Object.keys(dashboardData).length === 0) && (
            <Row style={{ marginTop: 20 }}>
              <Col span={24}>
                <Alert
                  message="No hay datos disponibles"
                  description="El dashboard no ha recibido información del servidor."
                  type="info"
                  showIcon
                />
              </Col>
            </Row>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;