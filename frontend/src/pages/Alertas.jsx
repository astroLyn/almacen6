import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Progress,
  Button,
  message,
  Tabs,
  Alert,
  Row,
  Col,
  Badge,
  Tooltip,
  Empty,
  Grid,
  Space,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext.jsx";

const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const AlertasStock = () => {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promedioStock, setPromedioStock] = useState(0);
  const [mostrarAlertaGeneral, setMostrarAlertaGeneral] = useState(true);

  const obtenerAlertas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/alertas");
      setAlertas(Array.isArray(res.data.alertas) ? res.data.alertas : []);
    } catch (error) {
      console.error("❌ Error al obtener alertas:", error);
      message.error("Error al obtener alertas");
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPromedioStock = async () => {
    try {
      const res = await api.get("/alertas/promedio");
      setPromedioStock(res.data.promedioGeneralStock ?? 0);
    } catch (error) {
      console.error("❌ Error al obtener promedio de stock:", error);
      setPromedioStock(0);
    }
  };

  const cerrarAlerta = async (id) => {
    try {
      await api.put(`/alertas/${id}/cerrar`);
      message.success("✅ Alerta resuelta correctamente");
      await Promise.all([obtenerAlertas(), obtenerPromedioStock()]);
    } catch (error) {
      console.error("❌ Error al cerrar alerta:", error);
      message.error("No se pudo cerrar la alerta");
    }
  };

  const marcarAlertaComoVista = async (id) => {
    try {
      await api.put(`/alertas/${id}/vista`);
      message.success("✅ Alerta marcada como vista");
      obtenerAlertas();
    } catch (error) {
      console.error("❌ Error al marcar alerta como vista:", error);
      message.error("No se pudo marcar la alerta como vista");
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([obtenerAlertas(), obtenerPromedioStock()]);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  const alertasActivas = alertas.filter((a) => a.estadoAlerta === "ACTIVA");
  const alertasCerradas = alertas.filter((a) => a.estadoAlerta === "CERRADA");

  const totalAlertas = alertas.length;
  const totalActivas = alertasActivas.length;

  // 🔁 Acciones compartidas entre tabla (desktop) y cards (móvil)
  const renderAcciones = (record, { block = false } = {}) => {
    if (user?.acceso === "ENC") {
      return (
        <Space
          size={8}
          style={{
            display: "flex",
            flexDirection: block ? "column" : "row",
            width: block ? "100%" : "auto",
          }}
        >
          {!record.vista && (
            <Button
              size="small"
              onClick={() => marcarAlertaComoVista(record.idAlerta)}
              block={block}
            >
              Marcar Vista
            </Button>
          )}
          {record.estadoAlerta === "ACTIVA" ? (
            <Tooltip
              title={
                record.stockActual <= 0
                  ? "No puedes resolver una alerta si el stock es 0"
                  : "Marcar como resuelta"
              }
            >
              <span style={{ display: "block", width: block ? "100%" : "auto" }}>
                <Button
                  icon={<CheckCircleOutlined />}
                  type="primary"
                  size="small"
                  onClick={() => cerrarAlerta(record.idAlerta)}
                  disabled={record.stockActual <= 0}
                  block={block}
                >
                  Resolver
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Tag color="green" style={{ margin: 0 }}>
              Resuelta
            </Tag>
          )}
        </Space>
      );
    }
    return record.estadoAlerta !== "ACTIVA" ? (
      <Tag color="green" style={{ margin: 0 }}>
        Resuelta
      </Tag>
    ) : null;
  };

  const columnas = [
    {
      title: "Código",
      dataIndex: "codigoMaterial",
      key: "codigoMaterial",
      width: 100,
    },
    {
      title: "Material",
      dataIndex: "nombreMaterial",
      key: "nombreMaterial",
      ellipsis: true,
    },
    {
      title: "Stock Actual",
      dataIndex: "stockActual",
      key: "stockActual",
      width: 120,
      render: (valor) => (
        <span style={{ color: "red", fontWeight: 500 }}>{valor}</span>
      ),
    },
    {
      title: "Stock Mínimo",
      dataIndex: "stockMinimo",
      key: "stockMinimo",
      width: 120,
    },
    {
      title: "Nivel",
      key: "nivel",
      width: 150,
      render: (_, record) => {
        const porcentaje = Math.round(record.porcentajeNivel);
        const color = porcentaje <= 40 ? "red" : "#faad14";
        const nivel = porcentaje <= 40 ? "Crítico" : "Bajo";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Progress
              percent={porcentaje}
              showInfo={false}
              strokeColor={color}
              size="small"
              style={{ width: 60 }}
            />
            <Tag color={color === "red" ? "error" : "warning"}>{nivel}</Tag>
          </div>
        );
      },
    },
    {
      title: "Fecha Alerta",
      dataIndex: "fechaAlerta",
      key: "fechaAlerta",
      width: 120,
      render: (fecha) => new Date(fecha).toLocaleDateString(),
    },
    {
      title: "Estado",
      dataIndex: "vista",
      key: "vista",
      width: 100,
      render: (vista) => (
        <Tag color={vista ? "blue" : "red"}>
          {vista ? "Vista" : "No Vista"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 150,
      render: (_, record) => renderAcciones(record, { block: false }),
    },
  ];

  // 📱 Render de una alerta como tarjeta (móvil)
  const renderAlertaCard = (record) => {
    const porcentaje = Math.round(record.porcentajeNivel);
    const color = porcentaje <= 40 ? "red" : "#faad14";
    const nivel = porcentaje <= 40 ? "Crítico" : "Bajo";

    return (
      <Card
        key={record.idAlerta}
        size="small"
        style={{ marginBottom: 12 }}
        styles={{ body: { padding: 12 } }}
      >
        {/* Encabezado: código + nombre + estado vista */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#888" }}>
              {record.codigoMaterial}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#333",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={record.nombreMaterial}
            >
              {record.nombreMaterial}
            </div>
          </div>
          <Tag
            color={record.vista ? "blue" : "red"}
            style={{ margin: 0, flexShrink: 0 }}
          >
            {record.vista ? "Vista" : "No Vista"}
          </Tag>
        </div>

        {/* Stock actual / mínimo */}
        <Row gutter={8} style={{ marginBottom: 10 }}>
          <Col span={12}>
            <div style={{ fontSize: 11, color: "#888" }}>Stock Actual</div>
            <div style={{ color: "red", fontWeight: 600, fontSize: 16 }}>
              {record.stockActual}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ fontSize: 11, color: "#888" }}>Stock Mínimo</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {record.stockMinimo}
            </div>
          </Col>
        </Row>

        {/* Nivel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <Progress
            percent={porcentaje}
            showInfo={false}
            strokeColor={color}
            size="small"
            style={{ flex: 1 }}
          />
          <Tag color={color === "red" ? "error" : "warning"} style={{ margin: 0 }}>
            {nivel}
          </Tag>
        </div>

        {/* Fecha */}
        <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
          Alerta generada: {new Date(record.fechaAlerta).toLocaleDateString()}
        </div>

        {/* Acciones */}
        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
          {renderAcciones(record, { block: true })}
        </div>
      </Card>
    );
  };

  // 📋 Render del contenido de una pestaña (cards en móvil / tabla en desktop)
  const renderContenido = (dataSource, emptyMsg) => {
    if (isMobile) {
      if (!loading && dataSource.length === 0) {
        return <Empty description={emptyMsg} />;
      }
      return <div>{dataSource.map(renderAlertaCard)}</div>;
    }
    return (
      <Table
        dataSource={dataSource}
        columns={columnas}
        rowKey="idAlerta"
        pagination={{ pageSize: 5 }}
        loading={loading}
        scroll={{ x: 800 }}
      />
    );
  };

  // 🔢 Tarjeta de estadística compacta
  const StatCard = ({ icon, color, label, value }) => (
    <Card
      bordered
      size={isMobile ? "small" : "default"}
      style={{ height: "100%" }}
      styles={{ body: { padding: isMobile ? 12 : 24 } }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
        <span
          style={{
            color,
            display: "flex",
            fontSize: isMobile ? 18 : 24,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              color: "#888",
              fontSize: isMobile ? 11 : 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? 18 : 24,
              fontWeight: "bold",
              lineHeight: 1.1,
            }}
          >
            {value}
          </h2>
        </div>
      </div>
    </Card>
  );

  return (
    <div
      style={{
        background: "#fff",
        padding: isMobile ? "16px 12px" : "24px 16px",
        borderRadius: 10,
      }}
    >
      <h2
        style={{
          marginBottom: 4,
          fontSize: isMobile ? 20 : 24,
          fontWeight: "bold",
        }}
      >
        Alertas de Stock
      </h2>
      <p style={{ color: "#888", marginBottom: isMobile ? 16 : 24, fontSize: isMobile ? 13 : 14 }}>
        Materiales con stock por debajo del mínimo
      </p>

      {totalActivas > 0 && mostrarAlertaGeneral && (
        <Alert
          message="⚠️ Atención Requerida"
          description={`Hay ${totalActivas} material(es) con stock por debajo del mínimo establecido. Se recomienda realizar pedidos de reabastecimiento.`}
          type="error"
          closable
          onClose={() => setMostrarAlertaGeneral(false)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stats: 2x2 en móvil, 4x1 en desktop */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<ExclamationCircleOutlined />}
            color="red"
            label="Alertas Activas"
            value={totalActivas}
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            color="green"
            label="Resueltas"
            value={alertasCerradas.length}
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<BellOutlined />}
            color="#faad14"
            label="Total Alertas"
            value={totalAlertas}
          />
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <StatCard
            icon={<Badge status="processing" />}
            color="#1677ff"
            label="Promedio Stock"
            value={`${promedioStock}%`}
          />
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" size={isMobile ? "small" : "middle"}>
        <TabPane tab={`Activas (${totalActivas})`} key="1">
          {renderContenido(alertasActivas, "No hay alertas activas")}
        </TabPane>
        <TabPane tab={`Resueltas (${alertasCerradas.length})`} key="2">
          {renderContenido(alertasCerradas, "No hay alertas resueltas")}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AlertasStock;