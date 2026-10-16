import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, Form, message, Tag, Popconfirm, Row, Col, Divider, Select, Space, Upload } from "antd";
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, UploadOutlined } from "@ant-design/icons";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext.jsx";

const { Search } = Input;
const { Option } = Select;

const GestionMateriales = () => {
  const { user } = useAuth(); 

  const [materiales, setMateriales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  
  const [filtros, setFiltros] = useState({ descripcion: "", categoria: "", ubicacion: "", marca: "" });
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 🌟 NUEVO: Estado para guardar la imagen seleccionada al editar
  const [imagenArchivo, setImagenArchivo] = useState(null);

  // 🌟 NUEVO: Configuración del botón de carga
  const propsSubida = {
    beforeUpload: (file) => {
      const esImagen = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!esImagen) {
        message.error('¡Solo puedes subir archivos de imagen (JPG, PNG, WEBP)!');
        return Upload.LIST_IGNORE;
      }
      setImagenArchivo(file);
      return false; // Evita que Ant Design intente subirlo automáticamente
    },
    onRemove: () => {
      setImagenArchivo(null);
    },
    maxCount: 1,
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

  const obtenerMateriales = async (filtros = {}) => {
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
    setImagenArchivo(null); // Limpiamos si quedó alguna foto atascada de una edición anterior
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
        nuevoCodigoMaterial: values.codigoMaterial 
      };

      // PASO 1: Actualizamos la información de texto
      await api.put(`/materiales/${materialSeleccionado.codigoMaterial}`, payload);
      
      // PASO 2: Si la usuaria seleccionó una nueva foto, la enviamos
      if (imagenArchivo) {
        const formData = new FormData();
        formData.append("imagen", imagenArchivo);

        await api.post(`/materiales/${values.codigoMaterial}/imagen`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      message.success("✅ Material actualizado correctamente");
      obtenerMateriales(filtros);
      cerrarModal();
    } catch (error) {
      console.error("❌ Error al actualizar material:", error.message);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Error al actualizar el material";
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
      message.error(error.response?.data?.error || error.response?.data?.detalle || "Error al eliminar el material");
    }
  };

  const reactivarMaterial = async (codigo) => {
    try {
      await api.put(`/materiales/${codigo}/reactivar`);
      message.success("✅ Material reactivado exitosamente");
      obtenerMateriales(filtros);
    } catch (error) {
      console.error("❌ Error al reactivar material:", error.message);
      message.error(error.response?.data?.error || "Error al reactivar el material");
    }
  };

  const handleSearch = (value) => {
    setFiltros(prev => ({ ...prev, descripcion: value }));
  };

  const handleCategoriaChange = (value) => {
    setFiltros(prev => ({ ...prev, categoria: value || "" }));
  };

  const handleUbicacionChange = (value) => {
    setFiltros(prev => ({ ...prev, ubicacion: value || "" }));
  };

  const handleMarcaChange = (value) => {
    setFiltros(prev => ({ ...prev, marca: value || "" }));
  };

  const limpiarFiltros = () => {
    setFiltros({ descripcion: "", categoria: "", ubicacion: "", marca: "" });
  };

  const columnas = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigoMaterial" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      render: (_, record) => (
        <Tag color={getUbicacionColor(record.ubicacion)} style={{ marginRight: 4, color: 'black', fontWeight: 'bold' }}>
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
        <Tag color={estado === 'ACT' ? 'green' : 'red'}>
          {estado === 'ACT' ? 'ACTIVO' : 'INACTIVO'}
        </Tag>
      )
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} type="link" onClick={() => mostrarModal(record)} />

          {user?.acceso === 'ENC' && (
            <>
              {record.estado !== 'ACT' ? (
                <Popconfirm
                  title="¿Reactivar material?"
                  description="El material volverá al estado activo."
                  onConfirm={() => reactivarMaterial(record.codigoMaterial)}
                  okText="Sí, reactivar"
                  cancelText="No"
                >
                  <Button icon={<CheckCircleOutlined />} type="link" style={{ color: '#52c41a' }} />
                </Popconfirm>
              ) : (
                <Popconfirm
                  title="¿Eliminar material?"
                  description="Esta acción cambiará el estado del material a inactivo."
                  onConfirm={() => eliminarMaterial(record.codigoMaterial)}
                  okText="Sí, eliminar"
                  cancelText="No"
                >
                  <Button icon={<DeleteOutlined />} type="link" danger />
                </Popconfirm>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2">Gestionar Materiales</h2>
      <p className="text-gray-500 mb-4">Editar y eliminar materiales del inventario</p>

      <div style={{ marginBottom: 16, display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Search 
          placeholder="Buscar por descripción..." 
          allowClear 
          style={{ width: 250 }} 
          onSearch={handleSearch} 
          enterButton 
          onChange={(e) => { if (e.target.value === "") handleSearch(""); }}
        />
        
        <Select placeholder="Categoría" style={{ width: 150 }} value={filtros.categoria || undefined} onChange={handleCategoriaChange} allowClear>
          {categorias.map((cat) => (
            <Option key={cat.codigo || cat.claveCategoria} value={cat.codigo || cat.claveCategoria}>
              {cat.categoria || cat.nombre}
            </Option>
          ))}
        </Select>

        <Select placeholder="Ubicación" style={{ width: 150 }} value={filtros.ubicacion || undefined} onChange={handleUbicacionChange} allowClear>
          {ubicaciones.map((u, i) => {
            const isObj = typeof u === 'object' && u !== null;
            const valor = isObj ? (u.codigoUbicacion || u.id || u.clave || i) : u;
            const texto = isObj ? (u.nombre || u.descripcion || u.ubicacion || `Ubicación ${valor}`) : u;
            return <Option key={valor} value={valor}>{texto}</Option>;
          })}
        </Select>

        <Select placeholder="Marca" style={{ width: 150 }} value={filtros.marca || undefined} onChange={handleMarcaChange} allowClear>
          {marcas.map((m, i) => {
            const isObj = typeof m === 'object' && m !== null;
            const valor = isObj ? (m.claveMarca || m.codigo || m.id || i) : m;
            const texto = isObj ? (m.nombre || m.descripcion || m.marca || `Marca ${valor}`) : m;
            return <Option key={valor} value={valor}>{texto}</Option>;
          })}
        </Select>

        <Button onClick={limpiarFiltros} type="default">
          Limpiar Filtros
        </Button>
      </div>

      <Table 
        columns={columnas} 
        dataSource={materiales} 
        rowKey="codigoMaterial" 
        pagination={{ pageSize: 6 }} 
        bordered 
        loading={loading}
        rowClassName={(record) => record.estado !== 'ACT' ? 'fila-inactiva' : ''}
        onRow={(record) => ({
          style: { 
            opacity: record.estado !== 'ACT' ? 0.6 : 1 
          }
        })}
      />

      <Modal title="Editar Material" open={isModalVisible} onCancel={cerrarModal} onOk={() => form.submit()} okText="Guardar Cambios" cancelText="Cancelar" width={650} confirmLoading={loading}>
        <Form form={form} layout="vertical" onFinish={actualizarMaterial}>
          <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="Código" name="codigoMaterial" rules={[{ required: true, message: 'El código no puede estar vacío' }]}>
                  <Input placeholder="Ej. CBL-01" />
                </Form.Item>
              </Col>
            <Col span={12}><Form.Item label="Descripción" name="descripcion" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}><Form.Item label="Color" name="color"><Input placeholder="Ejemplo: Azul, Rojo, Gris..." /></Form.Item></Col>
            <Col span={12}>
              <Form.Item label="Unidad de Medida" name="unidadMedida">
                <Select placeholder="Selecciona unidad">
                  <Option value="Pieza">Pieza</Option><Option value="Rollo">Rollo</Option><Option value="Metro">Metro</Option>
                  <Option value="Caja">Caja</Option><Option value="Kit">Kit</Option><Option value="Bolsa">Bolsa</Option>
                  <Option value="Bote">Bote</Option><Option value="Pie">Pie</Option><Option value="Otro">Otro</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Categoría" name="categoria" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona categoría" optionFilterProp="children">
                  {categorias.map((cat) => <Option key={cat.codigo || cat.claveCategoria} value={cat.codigo || cat.claveCategoria}>{cat.categoria || cat.nombre}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ubicación" name="ubicacion" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona ubicación" optionFilterProp="children">
                  {ubicaciones.map((ubi) => {
                    const valor = ubi.codigoUbicacion || ubi.codigo || ubi.id;
                    const texto = ubi.nombre || ubi.descripcion || ubi.ubicacion;
                    return <Option key={valor} value={valor}>{texto}</Option>;
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Marca" name="marca" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona marca" optionFilterProp="children">
                  {marcas.map((m) => {
                    const valor = m.claveMarca || m.codigo || m.id;
                    const texto = m.nombre || m.descripcion || m.marca;
                    return <Option key={valor} value={valor}>{texto}</Option>;
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Proveedor" name="proveedor" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona proveedor" optionFilterProp="children">
                  {proveedores.map((p) => <Option key={p.codigo} value={p.codigo}>{p.nombre}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}><Form.Item label="Stock Actual" name="stockActual"><Input type="number" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Stock Mínimo" name="stockMinimo"><Input type="number" /></Form.Item></Col>
          </Row>
          
          <Form.Item label="Observaciones" name="observaciones"><Input.TextArea rows={2} /></Form.Item>

          {/* 🌟 SECCIÓN DE IMAGEN */}
          <Divider>Fotografía del Material</Divider>
          
          {materialSeleccionado?.imagen && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <p style={{ color: '#888', marginBottom: 8 }}>Imagen Actual:</p>
              <img 
                src={`http://localhost:3000/uploads/${materialSeleccionado.imagen}`} 
                alt="Material" 
                style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #d9d9d9' }} 
              />
            </div>
          )}

          <Form.Item label={materialSeleccionado?.imagen ? "Reemplazar imagen actual" : "Subir nueva imagen"}>
            <Upload {...propsSubida}>
              <Button icon={<UploadOutlined />}>Seleccionar Archivo (JPG/PNG)</Button>
            </Upload>
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default GestionMateriales;