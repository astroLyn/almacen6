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
  message
} from "antd";
import { 
  DownloadOutlined, 
  ReloadOutlined,
  FileTextOutlined,
  InboxOutlined,
  UploadOutlined,
  ShoppingOutlined 
} from "@ant-design/icons";
import axios from "axios";
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
    totalSalidas: 0, 
    totalApartados: 0 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    obtenerResumen();
    obtenerMovimientos();
  }, []);

  const obtenerResumen = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/historial/totales");
      
      let totals;
      if (Array.isArray(response.data)) {
        totals = response.data[0] || {};
      } else {
        totals = response.data || {};
      }
      
      setResumen({
        totalMovimientos: totals.totalMovimientos || 0,
        totalEntradas: totals.totalEntradas || 0,
        totalSalidas: totals.totalSalidas || 0,
        totalApartados: totals.totalApartados || 0,
      });
    } catch (error) {
      console.error("Error al obtener totales:", error);
      message.error("No se pudo obtener el resumen de movimientos");
    }
  };

  const obtenerMovimientos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (busqueda) {
        params.append("codigo", busqueda);
        params.append("descripcion", busqueda);
      }
      
      if (filtroTipo !== "Todos") {
        params.append("tipo", filtroTipo);
      }
      
      if (rangoFechas && rangoFechas.length === 2) {
        params.append("fechaInicio", rangoFechas[0].format("YYYY-MM-DD"));
        params.append("fechaFin", rangoFechas[1].format("YYYY-MM-DD"));
      }

      const response = await axios.get(`http://localhost:3000/api/historial?${params}`);
      setMovimientos(response.data);
    } catch (error) {
      console.error("Error al obtener movimientos:", error);
      message.error("Error al cargar los movimientos");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    obtenerMovimientos();
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("Todos");
    setRangoFechas([]);
    obtenerMovimientos();
  };

  const exportarExcel = () => {
    message.info("Función de exportación en desarrollo");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      aplicarFiltros();
    }
  };

  const columnas = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 120,
      render: (fecha) => dayjs(fecha).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
    },
    {
      title: "Tipo",
      dataIndex: "tipoMovimiento",
      key: "tipoMovimiento",
      width: 100,
      render: (tipo) => {
        const config = {
          'Entrada': { color: 'green', text: 'ENTRADA' },
          'Salida': { color: 'red', text: 'SALIDA' },
          'Apartado': { color: 'orange', text: 'APARTADO' }
        };
        const { color, text } = config[tipo] || { color: 'default', text: tipo };
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Entradas', value: 'Entrada' },
        { text: 'Salidas', value: 'Salida' },
        { text: 'Apartados', value: 'Apartado' },
      ],
      onFilter: (value, record) => record.tipoMovimiento === value,
    },
    {
      title: "Código",
      dataIndex: "codigoMaterial",
      key: "codigoMaterial",
      width: 120,
    },
    {
      title: "Material",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 100,
      align: 'right',
      render: (cantidad, record) => (
        <Text 
          strong 
          style={{ 
            color: record.tipoMovimiento === 'Entrada' ? '#52c41a' : 
                   record.tipoMovimiento === 'Salida' ? '#ff4d4f' : '#fa8c16'
          }}
        >
          {record.tipoMovimiento === 'Entrada' ? '+' : ''}{cantidad}
        </Text>
      ),
      sorter: (a, b) => a.cantidad - b.cantidad,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 100,
      render: (estado) => (
        <Tag color={estado === 'Activo' ? 'blue' : 'default'}>
          {estado}
        </Tag>
      ),
    },
    {
      title: "Folio",
      dataIndex: "folioMovimiento",
      key: "folioMovimiento",
      width: 100,
      render: (folio, record) => (
        <Text type="secondary">#{folio}</Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 12 }} />
          Historial de Movimientos
        </Title>
        <Text type="secondary">
          Registro completo de entradas, salidas y apartados de materiales
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Movimientos"
              value={resumen.totalMovimientos}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Entradas"
              value={resumen.totalEntradas}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Salidas"
              value={resumen.totalSalidas}
              prefix={<UploadOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Apartados"
              value={resumen.totalApartados}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Text strong>Buscar:</Text>
            <Input
              placeholder="Código o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onPressEnter={handleKeyPress}
              style={{ marginTop: 8 }}
            />
          </Col>
          <Col span={4}>
            <Text strong>Tipo:</Text>
            <Select
              value={filtroTipo}
              onChange={setFiltroTipo}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="Todos">Todos los tipos</Option>
              <Option value="Entrada">Entradas</Option>
              <Option value="Salida">Salidas</Option>
              <Option value="Apartado">Apartados</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Text strong>Rango de fechas:</Text>
            <RangePicker
              value={rangoFechas}
              onChange={setRangoFechas}
              style={{ width: '100%', marginTop: 8 }}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col span={8}>
            <Space style={{ marginTop: 32 }}>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={aplicarFiltros}
                loading={loading}
              >
                Aplicar Filtros
              </Button>
              <Button 
                onClick={limpiarFiltros}
                disabled={loading}
              >
                Limpiar
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <Text>Movimientos Registrados</Text>
            <Tag color="blue">{movimientos.length} registros</Tag>
          </Space>
        }
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              obtenerResumen();
              obtenerMovimientos();
            }}
            loading={loading}
          >
            Actualizar
          </Button>
        }
      >
        <Table
          columns={columnas}
          dataSource={movimientos}
          rowKey={(record) => `${record.tipoMovimiento}-${record.folioMovimiento}-${record.codigoMaterial}`}
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} movimientos`
          }}
          scroll={{ x: 800 }}
          size="middle"
          bordered
        />
      </Card>
    </div>
  );
};

export default HistorialMovimientos;