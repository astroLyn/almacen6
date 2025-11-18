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
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { TabPane } = Tabs;

const AlertasStock = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promedioStock, setPromedioStock] = useState(0);
  const [mostrarAlertaGeneral, setMostrarAlertaGeneral] = useState(true);

  // 🔄 Obtener alertas desde el backend
  const obtenerAlertas = async () => {
  setLoading(true);
  try {
    const res = await axios.get("http://localhost:3000/api/alertas");
    console.log("📦 Datos del backend:", res.data);
    setAlertas(Array.isArray(res.data.alertas) ? res.data.alertas : []);
  } catch (error) {
    console.error("❌ Error al obtener alertas:", error);
    message.error("Error al obtener alertas");
    setAlertas([]);
  } finally {
    setLoading(false);
  }
};


  // 📊 Obtener promedio general de stock desde el endpoint específico
  const obtenerPromedioStock = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/alertas/promedio");
      setPromedioStock(res.data.promedioGeneralStock ?? 0);
    } catch (error) {
      console.error("❌ Error al obtener promedio de stock:", error);
      setPromedioStock(0);
    }
  };

  // ✅ Cerrar alerta individual
  const cerrarAlerta = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/alertas/${id}/cerrar`);
      message.success("✅ Alerta resuelta correctamente");
      // Recargar ambos: alertas y promedio
      await Promise.all([obtenerAlertas(), obtenerPromedioStock()]);
    } catch (error) {
      console.error("❌ Error al cerrar alerta:", error);
      message.error("No se pudo cerrar la alerta");
    }
  };

  // ✅ Marcar alerta como vista
  const marcarAlertaComoVista = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/alertas/${id}/vista`);
      message.success("✅ Alerta marcada como vista");
      obtenerAlertas(); // recargar alertas
    } catch (error) {
      console.error("❌ Error al marcar alerta como vista:", error);
      message.error("No se pudo marcar la alerta como vista");
    }
  };

  useEffect(() => {
    // Cargar ambos datos al iniciar el componente
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([obtenerAlertas(), obtenerPromedioStock()]);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  // Filtrar por estado
  const alertasActivas = alertas.filter((a) => a.estadoAlerta === "ACTIVA");
  const alertasCerradas = alertas.filter((a) => a.estadoAlerta === "CERRADA");

  const totalAlertas = alertas.length;
  const totalActivas = alertasActivas.length;

  // 🔹 Columnas de la tabla
  const columnas = [
    {
      title: "Código",
      dataIndex: "codigoMaterial",
      key: "codigoMaterial",
    },
    {
      title: "Material",
      dataIndex: "nombreMaterial",
      key: "nombreMaterial",
    },
    {
      title: "Stock Actual",
      dataIndex: "stockActual",
      key: "stockActual",
      render: (valor) => (
        <span style={{ color: "red", fontWeight: 500 }}>{valor}</span>
      ),
    },
    {
      title: "Stock Mínimo",
      dataIndex: "stockMinimo",
      key: "stockMinimo",
    },
    {
      title: "Nivel",
      key: "nivel",
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
      render: (fecha) => new Date(fecha).toLocaleDateString(),
    },
    {
      title: "Estado",
      dataIndex: "vista",
      key: "vista",
      render: (vista, record) => (
        <Tag color={vista ? "blue" : "red"}>
          {vista ? "Vista" : "No Vista"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          {!record.vista && (
            <Button
              size="small"
              onClick={() => marcarAlertaComoVista(record.idAlerta)}
            >
              Marcar Vista
            </Button>
          )}
          {record.estadoAlerta === "ACTIVA" ? (
            <Button
              icon={<CheckCircleOutlined />}
              type="primary"
              size="small"
              onClick={() => cerrarAlerta(record.idAlerta)}
            >
              Resolver
            </Button>
          ) : (
            <Tag color="green">Resuelta</Tag>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-1">Alertas de Stock</h2>
      <p className="text-gray-500 mb-4">
        Materiales con stock por debajo del mínimo
      </p>

      {/* 🟥 Alerta general de advertencia */}
      {totalActivas > 0 && mostrarAlertaGeneral && (
        <Alert
          message="⚠️ Atención Requerida"
          description={`Hay ${totalActivas} material(es) con stock por debajo del mínimo establecido. Se recomienda realizar pedidos de reabastecimiento.`}
          type="error"
          showIcon
          closable
          onClose={() => setMostrarAlertaGeneral(false)}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* 📊 Tarjetas resumen */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card bordered={false}>
            <div className="flex items-center gap-2">
              <ExclamationCircleOutlined style={{ fontSize: 24, color: "red" }} />
              <div>
                <p className="m-0 text-gray-500 text-sm">Alertas Activas</p>
                <h2 className="text-xl font-bold">{totalActivas}</h2>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div className="flex items-center gap-2">
              <CheckCircleOutlined style={{ fontSize: 24, color: "green" }} />
              <div>
                <p className="m-0 text-gray-500 text-sm">Resueltas</p>
                <h2 className="text-xl font-bold">{alertasCerradas.length}</h2>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div className="flex items-center gap-2">
              <BellOutlined style={{ fontSize: 24, color: "#faad14" }} />
              <div>
                <p className="m-0 text-gray-500 text-sm">Total Alertas</p>
                <h2 className="text-xl font-bold">{totalAlertas}</h2>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <div className="flex items-center gap-2">
              <Badge status="processing" />
              <div>
                <p className="m-0 text-gray-500 text-sm">Promedio Stock</p>
                <h2 className="text-xl font-bold">{promedioStock}%</h2>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 🧭 Tabs para separar alertas activas / resueltas */}
      <Tabs defaultActiveKey="1">
        <TabPane tab={`Alertas Activas (${totalActivas})`} key="1">
          <Table
            dataSource={alertasActivas}
            columns={columnas}
            rowKey="idAlerta"
            pagination={{ pageSize: 5 }}
            loading={loading}
          />
        </TabPane>

        <TabPane tab={`Resueltas (${alertasCerradas.length})`} key="2">
          <Table
            dataSource={alertasCerradas}
            columns={columnas}
            rowKey="idAlerta"
            pagination={{ pageSize: 5 }}
            loading={loading}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AlertasStock;