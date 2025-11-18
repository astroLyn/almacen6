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
  Tag 
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Colores para los gráficos
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];

// Mapeo de días de la semana
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Obtener datos del dashboard
  useEffect(() => {
    const obtenerDatosDashboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/api/dashboard");
        console.log("📊 Datos del dashboard:", response.data);
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

  // 🔹 Formatear datos para gráfico de barras (movimientos semanales)
  const formatearMovimientosSemanales = (movimientos) => {
    if (!movimientos || !Array.isArray(movimientos)) return [];
    
    return movimientos.map(item => ({
      name: DIAS_SEMANA[new Date(item.dia).getDay()] || 'Sin nombre',
      Entradas: parseInt(item.entradas) || 0,
      Salidas: parseInt(item.salidas) || 0,
      fechaOriginal: item.dia
    }));
  };

  // 🔹 Formatear datos para tabla de stock por categoría
  const formatearStockTabla = (stockData) => {
    if (!stockData || !Array.isArray(stockData)) return [];
    
    // Calcular el total para los porcentajes
    const totalStock = stockData.reduce((sum, item) => sum + parseFloat(item.stock || 0), 0);
    
    return stockData.map((item, index) => {
      const cantidad = parseFloat(item.stock || 0);
      const porcentaje = totalStock > 0 ? (cantidad / totalStock) * 100 : 0;
      
      return {
        key: index,
        categoria: item.categoria || 'Sin categoría',
        cantidad: cantidad,
        porcentaje: porcentaje,
        color: COLORS[index % COLORS.length]
      };
    });
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" tip="Cargando dashboard..." />
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ margin: "20px" }}>
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
    totalMovimientosHoy = {}
  } = dashboardData || {};

  // Datos formateados
  const datosMovimientosSemanales = formatearMovimientosSemanales(movimientosSemanales);
  const datosStockTabla = formatearStockTabla(stockPorCategoria);

  // Columnas para la tabla de stock por categoría
  const columnasStock = [
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            style={{
              width: 12,
              height: 12,
              backgroundColor: record.color,
              borderRadius: '50%',
              marginRight: 8
            }}
          />
          {text}
        </div>
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (cantidad) => (
        <Text strong>{cantidad.toLocaleString()} unidades</Text>
      ),
      sorter: (a, b) => a.cantidad - b.cantidad,
    },
    {
      title: 'Porcentaje',
      dataIndex: 'porcentaje',
      key: 'porcentaje',
      render: (porcentaje) => (
        <Tag color={porcentaje > 20 ? "green" : porcentaje > 10 ? "orange" : "red"}>
          {porcentaje ? `${porcentaje.toFixed(1)}%` : '0%'}
        </Tag>
      ),
      sorter: (a, b) => a.porcentaje - b.porcentaje,
    },
    {
      title: 'Distribución',
      key: 'distribucion',
      render: (_, record) => (
        <div style={{ width: '100%', backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <div 
            style={{ 
              width: `${Math.min(record.porcentaje, 100)}%`, 
              height: 8, 
              backgroundColor: record.color,
              borderRadius: 4
            }} 
          />
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Main Content */}
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "16px 24px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                Dashboard
              </Title>
              <Text type="secondary">Resumen general del almacén</Text>
            </Col>
            <Col>
              <Badge count={alertas.alertasActivas || 0}>
                <Avatar 
                  icon={<ExclamationCircleOutlined />} 
                  style={{ backgroundColor: '#ff4d4f' }} 
                />
              </Badge>
            </Col>
          </Row>
        </Header>

        <Content style={{ margin: "20px", padding: "0 10px" }}>
          {/* Cards principales */}
          <Row gutter={[16, 16]}>
            {/* Total Materiales */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                size="small"
                style={{ height: "100%" }}
                bodyStyle={{ padding: "16px" }}
              >
                <Row align="middle" gutter={8}>
                  <Col>
                    <DatabaseOutlined style={{ fontSize: "24px", color: "#3B82F6" }} />
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ display: "block", fontSize: "12px" }}>
                      Total Materiales
                    </Text>
                    <Title level={3} style={{ margin: "4px 0", fontSize: "20px" }}>
                      {totalesMateriales.totalMateriales || 0}
                    </Title>
                    <Text type="success" style={{ fontSize: "11px" }}>
                      <ArrowUpOutlined /> Materiales en sistema
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Stock Total */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                size="small"
                style={{ height: "100%" }}
                bodyStyle={{ padding: "16px" }}
              >
                <Row align="middle" gutter={8}>
                  <Col>
                    <BarChartOutlined style={{ fontSize: "24px", color: "#10B981" }} />
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ display: "block", fontSize: "12px" }}>
                      Stock Total
                    </Text>
                    <Title level={3} style={{ margin: "4px 0", fontSize: "20px" }}>
                      {parseFloat(totalesMateriales.stockTotal || 0).toLocaleString()}
                    </Title>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      {parseFloat(totalesMateriales.totalReservado || 0).toLocaleString()} reservados
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Alertas Activas */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                size="small"
                style={{ height: "100%" }}
                bodyStyle={{ padding: "16px" }}
              >
                <Row align="middle" gutter={8}>
                  <Col>
                    <ExclamationCircleOutlined style={{ fontSize: "24px", color: "#EF4444" }} />
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ display: "block", fontSize: "12px" }}>
                      Alertas Activas
                    </Text>
                    <Title level={3} style={{ margin: "4px 0", fontSize: "20px", color: "#EF4444" }}>
                      {alertas.alertasActivas || 0}
                    </Title>
                    <Text type="danger" style={{ fontSize: "11px" }}>
                      ⚠️ Stock bajo mínimo
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Entradas por Aprobar */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                size="small"
                style={{ height: "100%" }}
                bodyStyle={{ padding: "16px" }}
              >
                <Row align="middle" gutter={8}>
                  <Col>
                    <ClockCircleOutlined style={{ fontSize: "24px", color: "#F59E0B" }} />
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ display: "block", fontSize: "12px" }}>
                      Entradas por Aprobar
                    </Text>
                    <Title level={3} style={{ margin: "4px 0", fontSize: "20px", color: "#F59E0B" }}>
                      {aprobacionesPendientes.entradasPorAprobar || 0}
                    </Title>
                    <Text type="warning" style={{ fontSize: "11px" }}>
                      ⏳ Esperando revisión
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Salidas por Aprobar */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                size="small"
                style={{ height: "100%" }}
                bodyStyle={{ padding: "16px" }}
              >
                <Row align="middle" gutter={8}>
                  <Col>
                    <CheckCircleOutlined style={{ fontSize: "24px", color: "#8B5CF6" }} />
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ display: "block", fontSize: "12px" }}>
                      Salidas por Aprobar
                    </Text>
                    <Title level={3} style={{ margin: "4px 0", fontSize: "20px", color: "#8B5CF6" }}>
                      {aprobacionesPendientes.salidasPorAprobar || 0}
                    </Title>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      📋 Pendientes de autorización
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Movimientos Hoy */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                size="small"
                style={{ height: "100%" }}
                bodyStyle={{ padding: "16px" }}
              >
                <Row align="middle" gutter={8}>
                  <Col>
                    <AppstoreOutlined style={{ fontSize: "24px", color: "#06B6D4" }} />
                  </Col>
                  <Col flex="auto">
                    <Text strong style={{ display: "block", fontSize: "12px" }}>
                      Movimientos Hoy
                    </Text>
                    <Title level={3} style={{ margin: "4px 0", fontSize: "20px" }}>
                      {movimientosHoy.totalHoy || 0}
                    </Title>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      ↑ {movimientosHoy.entradasHoy || 0} entradas, {movimientosHoy.salidasHoy || 0} salidas
                    </Text>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Gráficos y Tablas */}
          <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            {/* Gráfico de Movimientos Semanales */}
            <Col xs={24} lg={12}>
              <Card 
                title="Movimientos de la Semana" 
                size="small"
                style={{ height: "400px" }}
              >
                {datosMovimientosSemanales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={datosMovimientosSemanales}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value} movimientos`, name]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return `Día: ${label}`;
                          }
                          return label;
                        }}
                      />
                      <Legend />
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
                  <div style={{ 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    No hay datos de movimientos esta semana
                  </div>
                )}
              </Card>
            </Col>

            {/* Tabla de Stock por Categoría */}
            <Col xs={24} lg={12}>
              <Card 
                title="Distribución de Stock por Categoría" 
                size="small"
                style={{ height: "400px", overflow: 'auto' }}
              >
                {datosStockTabla.length > 0 ? (
                  <Table 
                    dataSource={datosStockTabla}
                    columns={columnasStock}
                    pagination={false}
                    size="small"
                    scroll={{ y: 240 }}
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row style={{ background: '#fafafa' }}>
                          <Table.Summary.Cell index={0}>
                            <Text strong>Total</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <Text strong>
                              {datosStockTabla.reduce((sum, item) => sum + item.cantidad, 0).toLocaleString()} unidades
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
                ) : (
                  <div style={{ 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    No hay datos de stock por categoría
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Información adicional si no hay datos */}
          {(!dashboardData || Object.keys(dashboardData).length === 0) && (
            <Row style={{ marginTop: 20 }}>
              <Col span={24}>
                <Alert
                  message="No hay datos disponibles"
                  description="El dashboard no ha recibido información del servidor. Verifica que el procedimiento almacenado esté funcionando correctamente."
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