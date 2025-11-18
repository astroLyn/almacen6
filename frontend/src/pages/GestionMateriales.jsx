import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, Form, message, Tag, Popconfirm, Row, Col, Select } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

const { Search } = Input;
const { Option } = Select;

const GestionMateriales = () => {
  const [materiales, setMateriales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [form] = Form.useForm();

  // 🔵 Función para obtener el color de la ubicación (igual que inventario)
  const getUbicacionColor = (ubicacionNombre) => {
    const ubicacion = ubicaciones.find(
      (u) => u.ubicacion && u.ubicacion.trim() === (ubicacionNombre || "").trim()
    );
    if (ubicacion && typeof ubicacion.color === "string" && ubicacion.color.trim().length) {
      return ubicacion.color;
    }
    return "#1677ff";
  };

  // 🟢 Obtener materiales
  const obtenerMateriales = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/materiales");
      setMateriales(res.data);
    } catch (error) {
      console.error("❌ Error al obtener materiales:", error.message);
    }
  };

  // 🟢 Obtener catálogos
  const obtenerCatalogos = async () => {
    try {
      const [catRes, ubiRes, marRes, provRes] = await Promise.all([
        axios.get("http://localhost:3000/api/categorias"),
        axios.get("http://localhost:3000/api/ubicaciones"),
        axios.get("http://localhost:3000/api/marcas"),
        axios.get("http://localhost:3000/api/proveedores"),
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
    obtenerMateriales();
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
      imagen: material.imagen,
      categoria: material.codigoCategoria,
      ubicacion: material.codigoUbicacion,
      marca: material.codigoMarca,
      proveedor: material.codigoProveedor,
    });
    setIsModalVisible(true);
  };

  const cerrarModal = () => {
    setIsModalVisible(false);
    setMaterialSeleccionado(null);
    form.resetFields();
  };

  const actualizarMaterial = async (values) => {
    try {
      await axios.put(
        `http://localhost:3000/api/materiales/${materialSeleccionado.codigoMaterial}`,
        values
      );
      message.success("✅ Material actualizado correctamente");
      obtenerMateriales();
      cerrarModal();
    } catch (error) {
      console.error("❌ Error al actualizar material:", error.message);
      message.error("Error al actualizar el material");
    }
  };

  const eliminarMaterial = async (codigo) => {
    try {
      await axios.delete(`http://localhost:3000/api/materiales/${codigo}`);
      message.success("🗑️ Material eliminado correctamente");
      obtenerMateriales();
    } catch (error) {
      console.error("❌ Error al eliminar:", error.message);
      message.error("Error al eliminar el material");
    }
  };

  const columnas = [
    { title: "Código", dataIndex: "codigoMaterial", key: "codigoMaterial" },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion" },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      render: (_, record) => (
        <Tag color={getUbicacionColor(record.ubicacion)} style={{ marginRight: 4 }}>
          {record.ubicacion}
        </Tag>
      ),
    },
    { title: "Categoría", dataIndex: "categoria", key: "categoria" },
    { title: "Marca", dataIndex: "marca", key: "marca" },
    { title: "Proveedor", dataIndex: "proveedor", key: "proveedor" },
    { title: "Stock Actual", dataIndex: "stockActual", key: "stockActual" },
    { title: "Stock Mínimo", dataIndex: "stockMinimo", key: "stockMinimo" },
    { title: "Unidad", dataIndex: "unidadMedida", key: "unidadMedida" },
    { title: "Observaciones", dataIndex: "observaciones", key: "observaciones" },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} type="link" onClick={() => mostrarModal(record)} />
          <Popconfirm
            title="¿Eliminar material?"
            onConfirm={() => eliminarMaterial(record.codigoMaterial)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </>
      ),
    },
  ];

  const materialesFiltrados = materiales.filter((mat) =>
    mat.descripcion?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2">Gestionar Materiales</h2>
      <p className="text-gray-500 mb-4">Editar y eliminar materiales del inventario</p>

      <Search
        placeholder="Buscar material..."
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <Table
        columns={columnas}
        dataSource={materialesFiltrados}
        rowKey="codigoMaterial"
        pagination={{ pageSize: 6 }}
        bordered
      />

      <Modal
        title="Editar Material"
        open={isModalVisible}
        onCancel={cerrarModal}
        onOk={() => form.submit()}
        okText="Guardar Cambios"
        cancelText="Cancelar"
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={actualizarMaterial}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Código" name="codigoMaterial">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Descripción" name="descripcion" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* 🔵 Color como texto, no como color picker */}
            <Col span={12}>
              <Form.Item label="Color" name="color">
                <Input placeholder="Ejemplo: Azul, Rojo, Gris..." />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item label="Categoría" name="categoria" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona categoría" optionFilterProp="children">
                  {categorias.map((cat) => (
                    <Option key={cat.codigo} value={cat.codigo}>
                      {cat.categoria}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Ubicación" name="ubicacion" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona ubicación" optionFilterProp="children">
                  {ubicaciones.map((ubi) => (
                    <Option key={ubi.codigo} value={ubi.codigo}>
                      {ubi.ubicacion}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Marca" name="marca" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona marca" optionFilterProp="children">
                  {marcas.map((m) => (
                    <Option key={m.codigo} value={m.codigo}>
                      {m.nombre}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Proveedor" name="proveedor" rules={[{ required: true }]}>
                <Select showSearch placeholder="Selecciona proveedor" optionFilterProp="children">
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
            <Col span={12}>
              <Form.Item label="Stock Actual" name="stockActual">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Stock Mínimo" name="stockMinimo">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="URL Imagen" name="imagen">
            <Input placeholder="https://ejemplo.com/imagen.jpg" />
          </Form.Item>

          <Form.Item label="Observaciones" name="observaciones">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GestionMateriales;
