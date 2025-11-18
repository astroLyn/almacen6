import React, { useEffect, useState } from "react";
import { Table, Input, Select, Tag, Card, Row, Col, Typography, Space } from "antd";
import axios from "axios";
import { getMateriales } from "../api/materialService.js";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Inventario = () => {
  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [filtros, setFiltros] = useState({ descripcion: "", categoria: "" });
  const [loading, setLoading] = useState(false);

  // NUEVOS estados para totales desde BD
  const [stockTotal, setStockTotal] = useState(0);
  const [stockDisponible, setStockDisponible] = useState(0);

  // Cargar materiales filtrados
  const fetchMateriales = async () => {
    setLoading(true);
    try {
      const result = await getMateriales(filtros);
      setData(result);
      // después de obtener materiales (opcional) pedir totales actualizados
      await fetchTotales(); // actualizar totales cada vez que cambian los filtros/tabla
    } catch (error) {
      console.error("Error al cargar materiales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener totales desde backend
  const fetchTotales = async () => {
    try {
      const [totalRes, dispRes] = await Promise.all([
        axios.get("http://localhost:3000/api/stats/stock-total"),
        axios.get("http://localhost:3000/api/stats/stock-disponible"),
      ]);
      setStockTotal(totalRes.data?.stockTotal ?? 0);
      setStockDisponible(dispRes.data?.stockDisponible ?? 0);
    } catch (error) {
      console.error("Error al obtener totales:", error);
      // no interrumpir UI; mantener valores previos
    }
  };

  // cargar categorías y ubicaciones
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/categorias");
        setCategorias(res.data);
      } catch (error) {
        console.error("❌ Error al obtener categorías:", error);
      }
    };
    const fetchUbicaciones = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/ubicaciones");
        setUbicaciones(res.data);
      } catch (error) {
        console.error("❌ Error al obtener ubicaciones:", error);
      }
    };
    fetchCategorias();
    fetchUbicaciones();
    // al montar, también traer totales iniciales
    fetchTotales();
  }, []);

  // Refrescar materiales cuando cambien los filtros
  useEffect(() => {
    fetchMateriales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const handleSearch = (value) => {
    setFiltros((prev) => ({ ...prev, descripcion: value.trim() }));
  };

  const handleCategoriaChange = (value) => {
    setFiltros((prev) => ({ ...prev, categoria: value || "" }));
  };

  const getUbicacionColor = (ubicacionNombre) => {
    const ubicacion = ubicaciones.find(
      (u) => u.ubicacion && u.ubicacion.trim() === (ubicacionNombre || "").trim()
    );
    // acepta hex con # o nombres CSS
    if (ubicacion && typeof ubicacion.color === "string" && ubicacion.color.trim().length) {
      return ubicacion.color;
    }
    return "#1677ff";
  };

  const columns = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigoMaterial" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    { title: "Categoría", dataIndex: "categoria", key: "categoria" },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      render: (ubicacion) => <Tag color={getUbicacionColor(ubicacion)}>{ubicacion}</Tag>,
    },
    { title: "Stock Actual", dataIndex: "stockActual", key: "stockActual" },
    { title: "Stock Mínimo", dataIndex: "stockMinimo", key: "stockMinimo" },
    { title: "Stock Reservado", dataIndex: "stockReservado", key: "stockReservado" },
    { title: "Marca", dataIndex: "marca", key: "marca" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Inventario</Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <Search
          placeholder="Buscar por código o descripción..."
          onSearch={handleSearch}
          allowClear
          style={{ width: 300 }}
        />
        <Select
          placeholder="Selecciona una categoría"
          loading={!categorias.length}
          style={{ width: 300 }}
          onChange={handleCategoriaChange}
          allowClear
        >
          {categorias.map((cat) => (
            <Option key={cat.codigo} value={cat.codigo}>
              {cat.categoria}
            </Option>
          ))}
        </Select>
      </Space>

      <Table columns={columns} dataSource={data} loading={loading} rowKey="codigoMaterial" pagination={{ pageSize: 8 }} />

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card title="Total Materiales" bordered={false}>
            {data.length}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Stock Total" bordered={false}>
            {stockTotal}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Stock Disponible" bordered={false}>
            {stockDisponible}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Inventario;
