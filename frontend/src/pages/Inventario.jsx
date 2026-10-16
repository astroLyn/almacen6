import React, { useEffect, useState } from "react";
import { Table, Input, Select, Tag, Card, Row, Col, Typography, Space, Modal, Descriptions, Button, Image } from "antd";
import api from "../api/axiosConfig"; 

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Inventario = () => {
  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]); 
  
  const [filtros, setFiltros] = useState({ descripcion: "", categoria: "", ubicacion: "", marca: "" });
  
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);

  const [stockTotal, setStockTotal] = useState(0);
  const [stockDisponible, setStockDisponible] = useState(0);

  const [textoBusqueda, setTextoBusqueda] = useState("");

  // 🌟 CORRECCIÓN 1: Llamada directa a la API para garantizar que los 4 filtros viajen al backend
  const fetchMateriales = async () => {
    setLoading(true);
    try {
      const { descripcion, categoria, ubicacion, marca } = filtros;
      const res = await api.get("/materiales", {
        params: { 
          descripcion: descripcion || null, 
          categoria: categoria || null,
          ubicacion: ubicacion || null,
          marca: marca || null
        }
      });
      setData(res.data);
      await fetchTotales();
    } catch (error) {
      console.error("Error al cargar materiales:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotales = async () => {
    try {
      const [totalRes, dispRes] = await Promise.all([
        api.get('/stats/stock-total'),
        api.get('/stats/stock-disponible'),
      ]);
      setStockTotal(totalRes.data?.stockTotal ?? 0);
      setStockDisponible(dispRes.data?.stockDisponible ?? 0);
    } catch (error) {
      console.error("Error al obtener totales:", error);
    }
  };

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [catRes, ubiRes, marRes] = await Promise.all([
          api.get('/categorias'),
          api.get('/ubicaciones'),
          api.get('/marcas')
        ]);
        setCategorias(catRes.data);
        setUbicaciones(ubiRes.data);
        setMarcas(marRes.data);
      } catch (error) {
        console.error("❌ Error al obtener catálogos:", error);
      }
    };
    fetchCatalogos();
    fetchTotales();
  }, []);

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

  const handleUbicacionChange = (value) => {
    setFiltros((prev) => ({ ...prev, ubicacion: value || "" }));
  };

  const handleMarcaChange = (value) => {
    setFiltros((prev) => ({ ...prev, marca: value || "" }));
  };

  const limpiarFiltros = () => {
    setTextoBusqueda("");
    setFiltros({ descripcion: "", categoria: "", ubicacion: "", marca: "" });
  };

  const getUbicacionColor = (ubicacionNombre) => {
    const ubicacion = ubicaciones.find(
      (u) => (u.ubicacion || u.nombre) && (u.ubicacion || u.nombre).trim() === (ubicacionNombre || "").trim()
    );
    if (ubicacion && typeof ubicacion.color === "string" && ubicacion.color.trim().length) {
      return ubicacion.color;
    }
    return "#1677ff";
  };

  const handleRowClick = (record) => {
    setMaterialSeleccionado(record);
    setModalVisible(true);
  };

  const columns = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigoMaterial" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    { title: "Categoría", dataIndex: "categoria", key: "categoria" },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      render: (ubicacion) => (
        <Tag color={getUbicacionColor(ubicacion)} style={{ color: 'black', fontWeight: 'bold' }}>
          {ubicacion}
        </Tag>
      ),
    },
    { title: "Stock Actual", dataIndex: "stockActual", key: "stockActual" },
    { title: "Stock Mínimo", dataIndex: "stockMinimo", key: "stockMinimo" },
    { title: "Marca", dataIndex: "marca", key: "marca" },
    { 
      title: "Estado", 
      dataIndex: "estado", 
      key: "estado",
      render: (estado) => (
        <Tag color={estado === 'ACT' ? 'green' : 'red'}>
          {estado === 'ACT' ? 'ACTIVO' : 'INACTIVO'}
        </Tag>
      )
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Inventario</Title>

      <Card style={{ marginBottom: 24, borderRadius: '8px' }}>
        <Space wrap size="middle">
          <Search
            placeholder="Buscar código o descripción..."
            onSearch={handleSearch}
            value={textoBusqueda}
            onChange={(e) => {
              setTextoBusqueda(e.target.value);
              if (e.target.value === "") handleSearch("");
            }}
            allowClear
            style={{ width: 250 }}
          />
          <Select
            placeholder="Categoría"
            loading={!categorias.length}
            style={{ width: 150 }}
            value={filtros.categoria || undefined}
            onChange={handleCategoriaChange}
            allowClear
          >
            {categorias.map((cat) => (
              <Option key={cat.codigo || cat.claveCategoria} value={cat.codigo || cat.claveCategoria}>
                {cat.categoria || cat.nombre}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="Ubicación"
            loading={!ubicaciones.length}
            style={{ width: 150 }}
            value={filtros.ubicacion || undefined}
            onChange={handleUbicacionChange}
            allowClear
          >
            {ubicaciones.map((u, i) => {
              const isObj = typeof u === 'object' && u !== null;
              // 🌟 CORRECCIÓN 2: Se agregó "u.codigo" a la secuencia de evaluación del valor
              const valor = isObj ? (u.codigoUbicacion || u.codigo || u.id || u.clave || i) : u;
              const texto = isObj ? (u.nombre || u.descripcion || u.ubicacion || `Ubicación ${valor}`) : u;
              return <Option key={valor} value={valor}>{texto}</Option>;
            })}
          </Select>

          <Select
            placeholder="Marca"
            loading={!marcas.length}
            style={{ width: 150 }}
            value={filtros.marca || undefined}
            onChange={handleMarcaChange}
            allowClear
          >
            {marcas.map((m, i) => {
              const isObj = typeof m === 'object' && m !== null;
              const valor = isObj ? (m.claveMarca || m.codigo || m.id || i) : m;
              const texto = isObj ? (m.nombre || m.descripcion || m.marca || `Marca ${valor}`) : m;
              return <Option key={valor} value={valor}>{texto}</Option>;
            })}
          </Select>

          <Button onClick={limpiarFiltros} disabled={loading}>
            Limpiar Filtros
          </Button>
        </Space>
      </Card>

      <Table 
        columns={columns} 
        dataSource={data} 
        loading={loading} 
        rowKey="codigoMaterial" 
        pagination={{ pageSize: 8 }}
        rowClassName={(record) => record.estado !== 'ACT' ? 'fila-inactiva' : ''}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { 
            cursor: 'pointer', 
            opacity: record.estado !== 'ACT' ? 0.6 : 1 
          }
        })}
      />

      <Modal
        title="Detalles del Material"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {materialSeleccionado && (
          <>
            {materialSeleccionado.imagen && (
              <div style={{ textAlign: 'center', marginBottom: 24, padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #d9d9d9' }}>
                <Image
                  src={`http://localhost:3000/uploads/${materialSeleccionado.imagen}`}
                  alt={materialSeleccionado.descripcion}
                  style={{ maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }}
                />
                <p style={{ color: '#8c8c8c', marginTop: '8px', marginBottom: 0, fontSize: '12px' }}>Clic en la imagen para ampliar</p>
              </div>
            )}

            <Descriptions bordered column={2}>
              <Descriptions.Item label="Código" span={2}>{materialSeleccionado.codigoMaterial}</Descriptions.Item>
              <Descriptions.Item label="Descripción" span={2}>{materialSeleccionado.descripcion}</Descriptions.Item>
              
              <Descriptions.Item label="Estado" span={2}>
                <Tag color={materialSeleccionado.estado === 'ACT' ? 'green' : 'red'} style={{ fontWeight: 'bold' }}>
                  {materialSeleccionado.estado === 'ACT' ? 'MATERIAL ACTIVO' : 'MATERIAL DADO DE BAJA'}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Categoría">{materialSeleccionado.categoria}</Descriptions.Item>
              <Descriptions.Item label="Ubicación">
                <Tag color={getUbicacionColor(materialSeleccionado.ubicacion)} style={{ color: 'black', fontWeight: 'bold', margin: 0 }}>
                  {materialSeleccionado.ubicacion}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Stock Actual">{materialSeleccionado.stockActual}</Descriptions.Item>
              <Descriptions.Item label="Stock Mínimo">{materialSeleccionado.stockMinimo}</Descriptions.Item>
              <Descriptions.Item label="Stock Reservado">{materialSeleccionado.stockReservado || 0}</Descriptions.Item>
              <Descriptions.Item label="Marca">{materialSeleccionado.marca}</Descriptions.Item>
              <Descriptions.Item label="Unidad de Medida" span={2}>{materialSeleccionado.unidadMedida || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Proveedor" span={2}>{materialSeleccionado.proveedor || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Notas" span={2}>{materialSeleccionado.notas || "N/A"}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card title="Total Materiales Activos" bordered={false}>{data.filter(m => m.estado === 'ACT').length}</Card>
        </Col>
        <Col span={8}>
          <Card title="Stock Total" bordered={false}>{stockTotal}</Card>
        </Col>
        <Col span={8}>
          <Card title="Stock Disponible" bordered={false}>{stockDisponible}</Card>
        </Col>
      </Row>
    </div>
  );
};

export default Inventario;
