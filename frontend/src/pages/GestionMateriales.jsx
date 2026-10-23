import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Divider,
  Select,
  Space,
  Upload,
  Grid,
  Empty,
  Tooltip,
  Pagination, // 🌟 1. Importamos Pagination
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext.jsx";

const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

const GestionMateriales = () => {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  // 🌟 2. Estados para la paginación móvil
  const [pageMateriales, setPageMateriales] = useState(1);
  const [pageSizeMateriales] = useState(5);

  const [materiales, setMateriales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [filtros, setFiltros] = useState({
    descripcion: "",
    categoria: "",
    ubicacion: "",
    marca: "",
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [imagenArchivo, setImagenArchivo] = useState(null);

  const propsSubida = {
    beforeUpload: (file) => {
      const esImagen =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp";
      if (!esImagen) {
        message.error("¡Solo puedes subir archivos de imagen (JPG, PNG, WEBP)!");
        return Upload.LIST_IGNORE;
      }
      setImagenArchivo(file);
      return false;
    },
    onRemove: () => setImagenArchivo(null),
    maxCount: 1,
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

  const obtenerMateriales = async (filtros = {}) => {
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
      setMateriales(res.data);
    } catch (error) {
      console.error("❌ Error al obtener materiales:", error.message);
      message.error("Error al cargar materiales");
    } finally {
      setLoading(false);
    }
  };

  const obtenerCatalogos = async () => {
    try {
      const [catRes, ubiRes, marRes, provRes] = await Promise.all([
        api.get("/categorias"),
        api.get("/ubicaciones"),
        api.get("/marcas"),
        api.get("/proveedores"),
      ]);
      setCategorias(catRes.data);
      setUbicaciones(ubiRes.data);
      setMarcas(marRes.data);
      setProveedores(provRes.data);
    } catch (error) {
      console.error("❌ Error al obtener catálogos:", error.message);
    }
  };

  // 🌟 3. Reiniciar paginación al cambiar filtros
  useEffect(() => {
    setPageMateriales(1);
  }, [filtros]);

  useEffect(() => {
    obtenerMateriales(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  useEffect(() => {
    obtenerCatalogos();
  }, []);

  const mostrarModal = (material) => {
    setMaterialSeleccionado(material);
    form.setFieldsValue({
      codigoMaterial: material.codigoMaterial,
      descripcion: material.descripcion,
      color: material.color,
      unidadMedida: material.unidadMedida,
      observaciones: material.observaciones,
      stockActual: material.stockActual,
      stockMinimo: material.stockMinimo,
      categoria: material.codigoCategoria,
      ubicacion: material.codigoUbicacion,
      marca: material.codigoMarca,
      proveedor: material.codigoProveedor,
    });
    setImagenArchivo(null);
    setIsModalVisible(true);
  };

  const cerrarModal = () => {
    setIsModalVisible(false);
    setMaterialSeleccionado(null);
    setImagenArchivo(null);
    form.resetFields();
  };

  const actualizarMaterial = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        nuevoCodigoMaterial: values.codigoMaterial,
      };

      await api.put(
        `/materiales/${materialSeleccionado.codigoMaterial}`,
        payload
      );

      if (imagenArchivo) {
        const formData = new FormData();
        formData.append("imagen", imagenArchivo);

        await api.post(
          `/materiales/${values.codigoMaterial}/imagen`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      message.success("✅ Material actualizado correctamente");
      obtenerMateriales(filtros);
      cerrarModal();
    } catch (error) {
      console.error("❌ Error al actualizar material:", error.message);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error al actualizar el material";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const eliminarMaterial = async (codigo) => {
    try {
      await api.delete(`/materiales/${codigo}`);
      message.success("🗑️ Material eliminado correctamente");
      obtenerMateriales(filtros);
    } catch (error) {
      console.error("❌ Error al eliminar:", error.message);
      message.error(
        error.response?.data?.error ||
          error.response?.data?.detalle ||
          "Error al eliminar el material"
      );
    }
  };

  const reactivarMaterial = async (codigo) => {
    try {
      await api.put(`/materiales/${codigo}/reactivar`);
      message.success("✅ Material reactivado exitosamente");
      obtenerMateriales(filtros);
    } catch (error) {
      console.error("❌ Error al reactivar material:", error.message);
      message.error(
        error.response?.data?.error || "Error al reactivar el material"
      );
    }
  };

  const handleSearch = (value) =>
    setFiltros((prev) => ({ ...prev, descripcion: value }));
  const handleCategoriaChange = (value) =>
    setFiltros((prev) => ({ ...prev, categoria: value || "" }));
  const handleUbicacionChange = (value) =>
    setFiltros((prev) => ({ ...prev, ubicacion: value || "" }));
  const handleMarcaChange = (value) =>
    setFiltros((prev) => ({ ...prev, marca: value || "" }));

  const limpiarFiltros = () => {
    setFiltros({ descripcion: "", categoria: "", ubicacion: "", marca: "" });
  };

  // 🔁 Bloque de acciones compartido
  const renderAcciones = (record, { block = false } = {}) => (
    <Space
      size={4}
      style={{
        display: "flex",
        flexDirection: block ? "column" : "row",
        width: block ? "100%" : "auto",
      }}
    >
      <Button
        icon={<EditOutlined />}
        type={block ? "default" : "link"}
        onClick={() => mostrarModal(record)}
        block={block}
      >
        {block ? "Editar" : null}
      </Button>

      {user?.acceso === "ENC" && (
        <>
          {record.estado !== "ACT" ? (
            <Popconfirm
              title="¿Reactivar material?"
              description="El material volverá al estado activo."
              onConfirm={() => reactivarMaterial(record.codigoMaterial)}
              okText="Sí, reactivar"
              cancelText="No"
            >
              <Button
                icon={<CheckCircleOutlined />}
                type={block ? "primary" : "link"}
                style={{ color: block ? undefined : "#52c41a" }}
                block={block}
              >
                {block ? "Reactivar" : null}
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="¿Eliminar material?"
              description="Esta acción cambiará el estado del material a inactivo."
              onConfirm={() => eliminarMaterial(record.codigoMaterial)}
              okText="Sí, eliminar"
              cancelText="No"
            >
              <Button
                icon={<DeleteOutlined />}
                type={block ? "default" : "link"}
                danger
                block={block}
              >
                {block ? "Eliminar" : null}
              </Button>
            </Popconfirm>
          )}
        </>
      )}
    </Space>
  );

  const columnas = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigoMaterial" },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
    },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      render: (_, record) => (
        <Tag
          color={getUbicacionColor(record.ubicacion)}
          style={{
            marginRight: 4,
            color: "black",
            fontWeight: "bold",
          }}
        >
          {record.ubicacion}
        </Tag>
      ),
    },
    { title: "Categoría", dataIndex: "categoria", key: "categoria" },
    { title: "Stock Actual", dataIndex: "stockActual", key: "stockActual" },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado) => (
        <Tag color={estado === "ACT" ? "green" : "red"}>
          {estado === "ACT" ? "ACTIVO" : "INACTIVO"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      render: (_, record) => renderAcciones(record, { block: false }),
    },
  ];

  // 🎴 Card móvil
  const renderMaterialCard = (record) => (
    <div
      key={record.codigoMaterial}
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        background: "#fff",
        opacity: record.estado !== "ACT" ? 0.65 : 1,
      }}
    >
      {/* Encabezado: código + estado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#888" }}>
            {record.codigoMaterial}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#333",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={record.descripcion}
          >
            {record.descripcion}
          </div>
        </div>
        <Tag
          color={record.estado === "ACT" ? "green" : "red"}
          style={{ margin: 0, flexShrink: 0 }}
        >
          {record.estado === "ACT" ? "ACTIVO" : "INACTIVO"}
        </Tag>
      </div>

      {/* Ubicación + Categoría */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <Tag
          color={getUbicacionColor(record.ubicacion)}
          style={{ margin: 0, color: "black", fontWeight: "bold" }}
        >
          {record.ubicacion || "Sin ubicación"}
        </Tag>
        {record.categoria && (
          <Tag color="blue" style={{ margin: 0 }}>
            {record.categoria}
          </Tag>
        )}
      </div>

      {/* Stock actual */}
      <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
        Stock actual:{" "}
        <span style={{ fontWeight: 600, color: "#333" }}>
          {record.stockActual}
        </span>
      </div>

      {/* Acciones */}
      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
        {renderAcciones(record, { block: true })}
      </div>
    </div>
  );

  // 🌟 4. Cálculo de los elementos paginados
  const indexOfLastItem = pageMateriales * pageSizeMateriales;
  const indexOfFirstItem = indexOfLastItem - pageSizeMateriales;
  const currentMateriales = materiales.slice(indexOfFirstItem, indexOfLastItem);

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
        Gestionar Materiales
      </h2>
      <p
        style={{
          color: "#888",
          marginBottom: isMobile ? 16 : 24,
          fontSize: isMobile ? 13 : 14,
        }}
      >
        Editar y eliminar materiales del inventario
      </p>

      {/* FILTROS */}
      <Row gutter={[8, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Search
            placeholder="Buscar por descripción..."
            allowClear
            style={{ width: "100%" }}
            onSearch={handleSearch}
            enterButton
            size={isMobile ? "large" : "middle"}
            onChange={(e) => {
              if (e.target.value === "") handleSearch("");
            }}
          />
        </Col>
        <Col xs={12} sm={12} lg={5}>
          <Select
            placeholder="Categoría"
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
            style={{ width: "100%" }}
            value={filtros.ubicacion || undefined}
            onChange={handleUbicacionChange}
            allowClear
            size={isMobile ? "large" : "middle"}
          >
            {ubicaciones.map((u, i) => {
              const isObj = typeof u === "object" && u !== null;
              const valor = isObj
                ? u.codigoUbicacion || u.id || u.clave || i
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
            type="default"
            style={{ width: "100%" }}
            size={isMobile ? "large" : "middle"}
          >
            Limpiar
          </Button>
        </Col>
      </Row>

      {/* Tabla en desktop / Cards en móvil */}
      {isMobile ? (
        loading ? (
          <div style={{ textAlign: "center", padding: 30 }}>
            <span style={{ color: "#888" }}>Cargando materiales...</span>
          </div>
        ) : materiales.length === 0 ? (
          <Empty description="Sin materiales" />
        ) : (
          <div>
            {/* 🌟 5. Usamos currentMateriales en lugar de materiales.map */}
            {currentMateriales.map(renderMaterialCard)}
            
            {/* 🌟 6. Agregamos el componente Pagination */}
            {materiales.length > pageSizeMateriales && (
              <Pagination
                current={pageMateriales}
                pageSize={pageSizeMateriales}
                total={materiales.length}
                onChange={setPageMateriales}
                size="small"
                showSizeChanger={false}
                style={{ textAlign: "center", marginTop: 12, marginBottom: 12 }}
              />
            )}
          </div>
        )
      ) : (
        <Table
          columns={columnas}
          dataSource={materiales}
          rowKey="codigoMaterial"
          pagination={{ pageSize: 6 }}
          bordered
          loading={loading}
          scroll={{ x: 800 }}
          rowClassName={(record) =>
            record.estado !== "ACT" ? "fila-inactiva" : ""
          }
          onRow={(record) => ({
            style: { opacity: record.estado !== "ACT" ? 0.6 : 1 },
          })}
        />
      )}

      {/* MODAL EDICIÓN */}
      <Modal
        title="Editar Material"
        open={isModalVisible}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        okText="Guardar Cambios"
        cancelText="Cancelar"
        width={isMobile ? "95%" : 650}
        style={{ top: isMobile ? 16 : 100 }}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={actualizarMaterial}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Código"
                name="codigoMaterial"
                rules={[
                  { required: true, message: "El código no puede estar vacío" },
                ]}
              >
                <Input placeholder="Ej. CBL-01" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Descripción"
                name="descripcion"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Color" name="color">
                <Input placeholder="Ejemplo: Azul, Rojo, Gris..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Unidad de Medida" name="unidadMedida">
                <Select placeholder="Selecciona unidad">
                  <Option value="Pieza">Pieza</Option>
                  <Option value="Rollo">Rollo</Option>
                  <Option value="Metro">Metro</Option>
                  <Option value="Caja">Caja</Option>
                  <Option value="Kit">Kit</Option>
                  <Option value="Bolsa">Bolsa</Option>
                  <Option value="Bote">Bote</Option>
                  <Option value="Pie">Pie</Option>
                  <Option value="Otro">Otro</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Categoría"
                name="categoria"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder="Selecciona categoría"
                  optionFilterProp="children"
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
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Ubicación"
                name="ubicacion"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder="Selecciona ubicación"
                  optionFilterProp="children"
                >
                  {ubicaciones.map((ubi) => {
                    const valor =
                      ubi.codigoUbicacion || ubi.codigo || ubi.id;
                    const texto =
                      ubi.nombre || ubi.descripcion || ubi.ubicacion;
                    return (
                      <Option key={valor} value={valor}>
                        {texto}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Marca"
                name="marca"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder="Selecciona marca"
                  optionFilterProp="children"
                >
                  {marcas.map((m) => {
                    const valor = m.claveMarca || m.codigo || m.id;
                    const texto = m.nombre || m.descripcion || m.marca;
                    return (
                      <Option key={valor} value={valor}>
                        {texto}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Proveedor"
                name="proveedor"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder="Selecciona proveedor"
                  optionFilterProp="children"
                >
                  {proveedores.map((p) => (
                    <Option key={p.codigo} value={p.codigo}>
                      {p.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Stock Actual" name="stockActual">
                <Input type="number" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Stock Mínimo" name="stockMinimo">
                <Input type="number" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Observaciones" name="observaciones">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider>Fotografía del Material</Divider>

          {materialSeleccionado?.imagen && (
            <div style={{ marginBottom: 16, textAlign: "center" }}>
              <p style={{ color: "#888", marginBottom: 8 }}>Imagen Actual:</p>
              <img
                src={`http://localhost:3000/uploads/${materialSeleccionado.imagen}`}
                alt="Material"
                style={{
                  maxWidth: "100%",
                  maxHeight: isMobile ? 160 : 200,
                  objectFit: "contain",
                  borderRadius: 8,
                  border: "1px solid #d9d9d9",
                }}
              />
            </div>
          )}

          <Form.Item
            label={
              materialSeleccionado?.imagen
                ? "Reemplazar imagen actual"
                : "Subir nueva imagen"
            }
          >
            <Upload {...propsSubida}>
              <Button icon={<UploadOutlined />} block={isMobile}>
                Seleccionar Archivo (JPG/PNG)
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GestionMateriales;