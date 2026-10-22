import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Select,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Modal,
  Descriptions,
  Button,
  Image,
  Grid,
  Empty,
  Space,
} from "antd";
import {
  AppstoreOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

const Inventario = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const [data, setData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]);

  const [filtros, setFiltros] = useState({
    descripcion: "",
    categoria: "",
    ubicacion: "",
    marca: "",
  });

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);

  const [stockTotal, setStockTotal] = useState(0);
  const [stockDisponible, setStockDisponible] = useState(0);

  const [textoBusqueda, setTextoBusqueda] = useState("");

  const fetchMateriales = async () => {
    setLoading(true);
    try {
      const { descripcion, categoria, ubicacion, marca } = filtros;
      const res = await api.get("/materiales", {
        params: {
          descripcion: descripcion || null,
          categoria: categoria || null,
          ubicacion: ubicacion || null,
          marca: marca || null,
        },
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
        api.get("/stats/stock-total"),
        api.get("/stats/stock-disponible"),
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
          api.get("/categorias"),
          api.get("/ubicaciones"),
          api.get("/marcas"),
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

  const handleSearch = (value) =>
    setFiltros((prev) => ({ ...prev, descripcion: value.trim() }));

  const handleCategoriaChange = (value) =>
    setFiltros((prev) => ({ ...prev, categoria: value || "" }));

  const handleUbicacionChange = (value) =>
    setFiltros((prev) => ({ ...prev, ubicacion: value || "" }));

  const handleMarcaChange = (value) =>
    setFiltros((prev) => ({ ...prev, marca: value || "" }));

  const limpiarFiltros = () => {
    setTextoBusqueda("");
    setFiltros({ descripcion: "", categoria: "", ubicacion: "", marca: "" });
  };

  const getUbicacionColor = (ubicacionNombre) => {
    const ubicacion = ubicaciones.find(
      (u) =>
        (u.ubicacion || u.nombre) &&
        (u.ubicacion || u.nombre).trim() === (ubicacionNombre || "").trim()
    );
    if (
      ubicacion &&
      typeof ubicacion.color === "string" &&
      ubicacion.color.trim().length
    ) {
      return ubicacion.color;
    }
    return "#1677ff";
  };

  const handleRowClick = (record) => {
    setMaterialSeleccionado(record);
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Código",
      dataIndex: "codigoMaterial",
      key: "codigoMaterial",
      width: 120,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
    },
    { title: "Categoría", dataIndex: "categoria", key: "categoria", width: 150 },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      width: 120,
      render: (ubicacion) => (
        <Tag
          color={getUbicacionColor(ubicacion)}
          style={{ color: "black", fontWeight: "bold" }}
        >
          {ubicacion}
        </Tag>
      ),
    },
    {
      title: "Stock Actual",
      dataIndex: "stockActual",
      key: "stockActual",
      width: 120,
    },
    {
      title: "Stock Mínimo",
      dataIndex: "stockMinimo",
      key: "stockMinimo",
      width: 120,
    },
    { title: "Marca", dataIndex: "marca", key: "marca", width: 150 },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 100,
      render: (estado) => (
        <Tag color={estado === "ACT" ? "green" : "red"}>
          {estado === "ACT" ? "ACTIVO" : "INACTIVO"}
        </Tag>
      ),
    },
  ];

  // 🎴 Card móvil tappable (toda la card abre el modal)
  const renderMaterialCard = (record) => (
    <div
      key={record.codigoMaterial}
      onClick={() => handleRowClick(record)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleRowClick(record);
      }}
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        background: "#fff",
        cursor: "pointer",
        opacity: record.estado !== "ACT" ? 0.6 : 1,
        transition: "background 0.2s, box-shadow 0.2s",
        WebkitTapHighlightColor: "transparent",
      }}
      onTouchStart={(e) =>
        (e.currentTarget.style.background = "#fafafa")
      }
      onTouchEnd={(e) => (e.currentTarget.style.background = "#fff")}
    >
      {/* Header: código + estado + chevron */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
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
          <Text strong style={{ fontSize: 12, color: "#888" }}>
            {record.codigoMaterial}
          </Text>
          <Tag
            color={record.estado === "ACT" ? "green" : "red"}
            style={{ margin: 0, flexShrink: 0, fontSize: 10 }}
          >
            {record.estado === "ACT" ? "ACTIVO" : "INACTIVO"}
          </Tag>
        </div>
        <RightOutlined style={{ fontSize: 11, color: "#bfbfbf" }} />
      </div>

      {/* Descripción */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#333",
          marginBottom: 8,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {record.descripcion}
      </div>

      {/* Tags: ubicación + categoría + marca */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <Tag
          color={getUbicacionColor(record.ubicacion)}
          style={{
            margin: 0,
            color: "black",
            fontWeight: "bold",
            fontSize: 11,
          }}
        >
          {record.ubicacion || "Sin ubicación"}
        </Tag>
        {record.categoria && (
          <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
            {record.categoria}
          </Tag>
        )}
        {record.marca && (
          <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
            {record.marca}
          </Tag>
        )}
      </div>

      {/* Stock actual / mínimo en 2 columnas */}
      <Row gutter={8}>
        <Col span={12}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>
            Stock Actual
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color:
                Number(record.stockActual) <= Number(record.stockMinimo)
                  ? "#ff4d4f"
                  : "#333",
            }}
          >
            {record.stockActual}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>
            Stock Mínimo
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#666" }}>
            {record.stockMinimo}
          </div>
        </Col>
      </Row>
    </div>
  );

  // 🔢 Mini stat card para móvil (compacta)
  const MiniStatCard = ({ icon, color, label, value }) => (
    <Card
      bordered={false}
      style={{ borderRadius: 8, height: "100%" }}
      styles={{ body: { padding: isMobile ? 10 : 24 } }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
        <span
          style={{
            color,
            fontSize: isMobile ? 16 : 22,
            display: "flex",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: isMobile ? 10 : 13,
              color: "#888",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={label}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: isMobile ? 16 : 22,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#333",
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </Card>
  );

  const totalActivos = data.filter((m) => m.estado === "ACT").length;

  return (
    <div
      style={{
        padding: isMobile ? "12px 8px" : "24px 16px",
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Title
        level={3}
        style={{
          marginBottom: isMobile ? 12 : 24,
          marginTop: 0,
          fontSize: isMobile ? 20 : 24,
        }}
      >
        Inventario
      </Title>

      {/* FILTROS */}
      <Card
        style={{ marginBottom: isMobile ? 12 : 24, borderRadius: 8 }}
        size={isMobile ? "small" : "default"}
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Search
              placeholder="Buscar código o descripción..."
              onSearch={handleSearch}
              value={textoBusqueda}
              onChange={(e) => {
                setTextoBusqueda(e.target.value);
                if (e.target.value === "") handleSearch("");
              }}
              allowClear
              size={isMobile ? "large" : "middle"}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={12} sm={12} lg={5}>
            <Select
              placeholder="Categoría"
              loading={!categorias.length}
              style={{ width: "100%" }}
              value={filtros.categoria || undefined}
              onChange={handleCategoriaChange}
              allowClear
              size={isMobile ? "large" : "middle"}
            >
              {categorias.map((cat) => (
                <Option
                  key={cat.codigo || cat.claveCategoria}
                  value={cat.codigo || cat.claveCategoria}
                >
                  {cat.categoria || cat.nombre}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={12} lg={5}>
            <Select
              placeholder="Ubicación"
              loading={!ubicaciones.length}
              style={{ width: "100%" }}
              value={filtros.ubicacion || undefined}
              onChange={handleUbicacionChange}
              allowClear
              size={isMobile ? "large" : "middle"}
            >
              {ubicaciones.map((u, i) => {
                const isObj = typeof u === "object" && u !== null;
                const valor = isObj
                  ? u.codigoUbicacion || u.codigo || u.id || u.clave || i
                  : u;
                const texto = isObj
                  ? u.nombre ||
                    u.descripcion ||
                    u.ubicacion ||
                    `Ubicación ${valor}`
                  : u;
                return (
                  <Option key={valor} value={valor}>
                    {texto}
                  </Option>
                );
              })}
            </Select>
          </Col>
          <Col xs={12} sm={12} lg={5}>
            <Select
              placeholder="Marca"
              loading={!marcas.length}
              style={{ width: "100%" }}
              value={filtros.marca || undefined}
              onChange={handleMarcaChange}
              allowClear
              size={isMobile ? "large" : "middle"}
            >
              {marcas.map((m, i) => {
                const isObj = typeof m === "object" && m !== null;
                const valor = isObj ? m.claveMarca || m.codigo || m.id || i : m;
                const texto = isObj
                  ? m.nombre || m.descripcion || m.marca || `Marca ${valor}`
                  : m;
                return (
                  <Option key={valor} value={valor}>
                    {texto}
                  </Option>
                );
              })}
            </Select>
          </Col>
          <Col xs={12} sm={12} lg={3}>
            <Button
              onClick={limpiarFiltros}
              disabled={loading}
              style={{ width: "100%" }}
              size={isMobile ? "large" : "middle"}
            >
              Limpiar
            </Button>
          </Col>
        </Row>
      </Card>

      {/* STATS: 3 en fila en móvil */}
      <Row
        gutter={[isMobile ? 6 : 16, isMobile ? 6 : 16]}
        style={{ marginBottom: isMobile ? 12 : 24 }}
      >
        <Col xs={8}>
          <MiniStatCard
            icon={<AppstoreOutlined />}
            color="#1890ff"
            label={isMobile ? "Activos" : "Total Materiales Activos"}
            value={totalActivos}
          />
        </Col>
        <Col xs={8}>
          <MiniStatCard
            icon={<DatabaseOutlined />}
            color="#52c41a"
            label="Stock Total"
            value={stockTotal}
          />
        </Col>
        <Col xs={8}>
          <MiniStatCard
            icon={<CheckCircleOutlined />}
            color="#faad14"
            label={isMobile ? "Disponible" : "Stock Disponible"}
            value={stockDisponible}
          />
        </Col>
      </Row>

      {/* LISTADO: Cards en móvil / Tabla en desktop */}
      {isMobile ? (
        loading ? (
          <Card
            style={{ borderRadius: 8, textAlign: "center", padding: 30 }}
            styles={{ body: { padding: 30 } }}
          >
            <Text type="secondary">Cargando inventario...</Text>
          </Card>
        ) : data.length === 0 ? (
          <Card
            style={{ borderRadius: 8 }}
            styles={{ body: { padding: 20 } }}
          >
            <Empty description="Sin materiales" />
          </Card>
        ) : (
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#888",
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              {data.length} material(es) · Toca uno para ver detalles
            </div>
            {data.map(renderMaterialCard)}
          </div>
        )
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="codigoMaterial"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 900 }}
          rowClassName={(record) =>
            record.estado !== "ACT" ? "fila-inactiva" : ""
          }
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: {
              cursor: "pointer",
              opacity: record.estado !== "ACT" ? 0.6 : 1,
            },
          })}
        />
      )}

      {/* MODAL DETALLE */}
      <Modal
        title="Detalles del Material"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          isMobile ? (
            <Button
              type="primary"
              block
              size="large"
              onClick={() => setModalVisible(false)}
            >
              Cerrar
            </Button>
          ) : null
        }
        width={isMobile ? "95%" : 700}
        style={{ top: isMobile ? 16 : 100 }}
      >
        {materialSeleccionado && (
          <>
            {materialSeleccionado.imagen && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: isMobile ? 16 : 24,
                  padding: isMobile ? 10 : 16,
                  backgroundColor: "#fafafa",
                  borderRadius: 8,
                  border: "1px dashed #d9d9d9",
                }}
              >
                <Image
                  src={`http://localhost:3000/uploads/${materialSeleccionado.imagen}`}
                  alt={materialSeleccionado.descripcion}
                  style={{
                    maxHeight: isMobile ? 160 : 200,
                    maxWidth: "100%",
                    objectFit: "contain",
                    borderRadius: 4,
                  }}
                />
                <p
                  style={{
                    color: "#8c8c8c",
                    marginTop: 8,
                    marginBottom: 0,
                    fontSize: 11,
                  }}
                >
                  Clic en la imagen para ampliar
                </p>
              </div>
            )}

            <Descriptions
              bordered
              size={isMobile ? "small" : "default"}
              column={{ xs: 1, sm: 2 }}
              labelStyle={{
                fontSize: isMobile ? 11 : 14,
                padding: isMobile ? "6px 8px" : undefined,
              }}
              contentStyle={{
                fontSize: isMobile ? 12 : 14,
                padding: isMobile ? "6px 8px" : undefined,
              }}
            >
              <Descriptions.Item label="Código" span={2}>
                {materialSeleccionado.codigoMaterial}
              </Descriptions.Item>
              <Descriptions.Item label="Descripción" span={2}>
                {materialSeleccionado.descripcion}
              </Descriptions.Item>

              <Descriptions.Item label="Estado" span={2}>
                <Tag
                  color={
                    materialSeleccionado.estado === "ACT" ? "green" : "red"
                  }
                  style={{ fontWeight: "bold", margin: 0 }}
                >
                  {materialSeleccionado.estado === "ACT"
                    ? "MATERIAL ACTIVO"
                    : "MATERIAL DADO DE BAJA"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Categoría">
                {materialSeleccionado.categoria}
              </Descriptions.Item>
              <Descriptions.Item label="Ubicación">
                <Tag
                  color={getUbicacionColor(materialSeleccionado.ubicacion)}
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  {materialSeleccionado.ubicacion}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Stock Actual">
                {materialSeleccionado.stockActual}
              </Descriptions.Item>
              <Descriptions.Item label="Stock Mínimo">
                {materialSeleccionado.stockMinimo}
              </Descriptions.Item>
              <Descriptions.Item label="Stock Reservado">
                {materialSeleccionado.stockReservado || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Marca">
                {materialSeleccionado.marca}
              </Descriptions.Item>
              <Descriptions.Item label="Unidad de Medida" span={2}>
                {materialSeleccionado.unidadMedida || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Proveedor" span={2}>
                {materialSeleccionado.proveedor || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Notas" span={2}>
                {materialSeleccionado.notas || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Inventario;
