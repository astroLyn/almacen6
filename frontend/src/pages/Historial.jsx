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
  Modal // 🌟 NUEVO IMPORT
} from "antd";
import { 
  ReloadOutlined,
  FileTextOutlined,
  InboxOutlined,
  UploadOutlined,
  UserOutlined,
  EyeOutlined // 🌟 NUEVO IMPORT
} from "@ant-design/icons";
import api from "../api/axiosConfig";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const HistorialMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [rangoFechas, setRangoFechas] = useState([]);
  const [resumen, setResumen] = useState({ 
    totalMovimientos: 0, 
    totalEntradas: 0, 
    totalSalidas: 0
  });
  const [loading, setLoading] = useState(false);

  // 🌟 NUEVOS ESTADOS PARA EL MODAL DE DETALLES
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
      let totals = Array.isArray(response.data) ? response.data[0] : response.data;
      
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

  // 🌟 FUNCIÓN PARA ABRIR Y CARGAR EL MODAL DE DETALLES
  const verDetalles = async (record) => {
    setMovimientoSeleccionado(record);
    setIsModalVisible(true);
    setLoadingDetalles(true);

    try {
      // Extrae solo los números del ID (Por si la referencia es "ENT-05", extrae "5")
      const idNumber = String(record.idReferencia).replace(/\D/g, '');
      
      // Enrutamiento inteligente: busca en entradas o salidas según el módulo
      const endpoint = record.modulo === 'Entradas' 
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
        if (fecha.includes('T00:00:00.000Z') || fecha.length === 10) {
          const [year, month, day] = fecha.substring(0, 10).split('-');
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
        let color = 'default';
        if (modulo === 'Entradas') color = 'green';
        if (modulo === 'Salidas') color = 'red';
        if (modulo === 'Usuarios' || modulo === 'Login') color = 'blue';
        return <Tag color={color}>{modulo.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Referencia",
      dataIndex: "idReferencia",
      key: "idReferencia",
      width: 120,
      render: (ref) => <Text strong type="secondary">{ref}</Text>,
    },
    {
      title: "Usuario",
      dataIndex: "nombreUsuario",
      key: "usuario",
      render: (nombre) => nombre ? (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong>{nombre}</Text>
        </Space>
      ) : <Text type="secondary">Sistema</Text>
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
    // 🌟 NUEVA COLUMNA DE ACCIONES
    {
      title: "Acciones",
      key: "acciones",
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        // Solo mostramos el botón si es una Entrada o Salida
        (record.modulo === 'Entradas' || record.modulo === 'Salidas') && (
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => verDetalles(record)}
          >
            Ver
          </Button>
        )
      )
    }
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 12 }} />
          Auditoría e Historial
        </Title>
        <Text type="secondary">
          Registro completo de movimientos de inventario y actividad del sistema.
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: '8px' }}>
            <Statistic title="Total Movimientos" value={resumen.totalMovimientos} prefix={<FileTextOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: '8px' }}>
            <Statistic title="Total Entradas" value={resumen.totalEntradas} prefix={<InboxOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: '8px' }}>
            <Statistic title="Total Salidas" value={resumen.totalSalidas} prefix={<UploadOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24, borderRadius: '8px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Text strong>Buscar:</Text>
            <Input placeholder="Referencia, usuario o acción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onPressEnter={aplicarFiltros} style={{ marginTop: 8 }} />
          </Col>
          <Col span={5}>
            <Text strong>Módulo:</Text>
            <Select value={filtroTipo} onChange={setFiltroTipo} style={{ width: '100%', marginTop: 8 }}>
              <Option value="Todos">Todos</Option>
              <Option value="Entradas">Entradas</Option>
              <Option value="Salidas">Salidas</Option>
              <Option value="Usuarios">Usuarios</Option>
              <Option value="Login">Accesos (Login)</Option>
            </Select>
          </Col>
          <Col span={7}>
            <Text strong>Rango de fechas:</Text>
            <RangePicker value={rangoFechas} onChange={setRangoFechas} style={{ width: '100%', marginTop: 8 }} format="DD/MM/YYYY" />
          </Col>
          <Col span={6}>
            <Space style={{ marginTop: 32 }}>
              <Button type="primary" icon={<ReloadOutlined />} onClick={aplicarFiltros} loading={loading}>Filtrar</Button>
              <Button onClick={limpiarFiltros} disabled={loading}>Limpiar</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: '8px' }} title={<Space><Text>Registro de Actividad</Text><Tag color="blue">{movimientos.length} registros</Tag></Space>} extra={<Button icon={<ReloadOutlined />} onClick={limpiarFiltros} loading={loading}>Actualizar</Button>}>
        <Table
          columns={columnas}
          dataSource={movimientos}
          rowKey={(record) => `${record.idReferencia}-${record.accion}`}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          bordered
        />
      </Card>

      {/* 🌟 MODAL DE DETALLE DE MATERIALES */}
      <Modal
        title={
          <Space>
            {movimientoSeleccionado?.modulo === 'Entradas' ? <InboxOutlined style={{ color: '#52c41a' }} /> : <UploadOutlined style={{ color: '#ff4d4f' }} />}
            <Text strong>Detalle de {movimientoSeleccionado?.modulo}</Text>
            <Tag color="default">Folio: {movimientoSeleccionado?.idReferencia}</Tag>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cerrar" type="primary" onClick={() => setIsModalVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={700}
      >
        <Table
          dataSource={detalleMateriales}
          loading={loadingDetalles}
          rowKey="codigoMaterial"
          pagination={false}
          size="small"
          bordered
          columns={[
            { title: "Código", dataIndex: "codigoMaterial", key: "codigo", width: 120 },
            { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
            { 
              title: "Cantidad Movida", 
              dataIndex: "cantidad", 
              key: "cantidad", 
              width: 150,
              align: 'center',
              render: (cantidad) => (
                <Tag color={movimientoSeleccionado?.modulo === 'Entradas' ? 'green' : 'red'} style={{ fontSize: '14px', padding: '4px 8px' }}>
                  {movimientoSeleccionado?.modulo === 'Entradas' ? '+' : '-'}{cantidad}
                </Tag>
              ) 
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default HistorialMovimientos;