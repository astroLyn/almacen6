import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Upload,
  Switch,
  message,
  Row,
  Col,
  Divider,
  Space,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;

const AgregarMaterial = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [nuevaMarca, setNuevaMarca] = useState("");

  // 📤 Enviar datos al backend
  const onFinish = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        codigoInterno: values.codigoInterno || false,
        stockActual: parseFloat(values.stockActual),
        stockMinimo: parseFloat(values.stockMinimo),
        imagen: values.imagen || null,
      };

      const res = await axios.post("http://localhost:3000/api/materiales", payload);
      message.success(res.data.message || "✅ Material agregado correctamente");
      form.resetFields();
    } catch (error) {
      console.error("❌ Error al agregar material:", error);
      message.error(error.response?.data?.error || "Error al agregar material");
    } finally {
      setLoading(false);
    }
  };

  // 📦 Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, ubiRes, provRes, marcaRes] = await Promise.all([
          axios.get("http://localhost:3000/api/categorias"),
          axios.get("http://localhost:3000/api/ubicaciones"),
          axios.get("http://localhost:3000/api/proveedores"),
          axios.get("http://localhost:3000/api/marcas"),
        ]);
        setCategorias(catRes.data);
        setUbicaciones(ubiRes.data);
        setProveedores(provRes.data);
        setMarcas(marcaRes.data);
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
      }
    };
    fetchData();
  }, []);

  // 🟢 Agregar nueva marca
  const agregarNuevaMarca = async () => {
    if (!nuevaMarca.trim()) {
      message.warning("Escribe un nombre para la nueva marca");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/marcas", { nombre: nuevaMarca });
      const nueva = res.data?.codigo
        ? res.data
        : { codigo: res.data.insertId || Date.now(), nombre: nuevaMarca }; // fallback
      setMarcas([...marcas, nueva]);
      message.success("Marca agregada correctamente");
      setNuevaMarca("");
    } catch (error) {
      console.error("❌ Error al agregar marca:", error);
      message.error("No se pudo agregar la marca");
    }
  };

  // 🟢 Agregar nuevo proveedor
  const agregarNuevoProveedor = async () => {
    if (!nuevoProveedor.trim()) {
      message.warning("Escribe un nombre para el nuevo proveedor");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/proveedores", { nombre: nuevoProveedor });
      const nuevo = res.data?.codigo
        ? res.data
        : { codigo: res.data.insertId || Date.now(), nombre: nuevoProveedor };
      setProveedores([...proveedores, nuevo]);
      message.success("Proveedor agregado correctamente");
      setNuevoProveedor("");
    } catch (error) {
      console.error("❌ Error al agregar proveedor:", error);
      message.error("No se pudo agregar el proveedor");
    }
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 10 }}>
      <h2 style={{ marginBottom: 20 }}>Agregar Nuevo Material</h2>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* 🔹 Código y Categoría */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Código *"
              name="codigoMaterial"
              rules={[{ required: true, message: "El código es obligatorio" }]}
            >
              <Input placeholder="Ej: MAT-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Categoría *"
              name="categoria"
              rules={[{ required: true, message: "Selecciona una categoría" }]}
            >
              <Select placeholder="Selecciona una categoría" loading={!categorias.length}>
                {categorias.map((cat) => (
                  <Option key={cat.codigo} value={cat.codigo}>
                    {cat.categoria}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 Descripción y Observaciones */}
        <Form.Item
          label="Descripción *"
          name="descripcion"
          rules={[{ required: true, message: "La descripción es obligatoria" }]}
        >
          <Input placeholder="Descripción detallada del material" />
        </Form.Item>

        <Form.Item label="Notas / Especificaciones" name="observaciones">
          <Input.TextArea placeholder="Información adicional, especificaciones técnicas, etc." />
        </Form.Item>

        {/* 🔹 Control de Stock */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Stock Actual *"
              name="stockActual"
              initialValue={0}
              rules={[{ required: true, message: "El stock actual es obligatorio" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Stock Mínimo *"
              name="stockMinimo"
              initialValue={0}
              rules={[{ required: true, message: "El stock mínimo es obligatorio" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 Ubicación, Marca, Proveedor */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Ubicación en Almacén *"
              name="ubicacion"
              rules={[{ required: true, message: "Selecciona una ubicación" }]}
            >
              <Select
                showSearch
                placeholder="Escribe o selecciona una ubicación"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {ubicaciones.map((u) => (
                  <Option key={u.codigo} value={u.codigo}>
                    {u.ubicacion}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* 🔸 Marca con opción de agregar */}
          <Col span={8}>
            <Form.Item label="Marca *" name="marca" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Escribe o selecciona una marca"
                optionFilterProp="children"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Input
                        placeholder="Nueva marca"
                        value={nuevaMarca}
                        onChange={(e) => setNuevaMarca(e.target.value)}
                      />
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={agregarNuevaMarca}
                      >
                        Agregar
                      </Button>
                    </Space>
                  </>
                )}
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                }
              >
                {marcas.map((m) => (
                  <Option key={m.codigo} value={m.codigo}>
                    {m.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* 🔸 Proveedor con opción de agregar */}
          <Col span={8}>
            <Form.Item
              label="Proveedor *"
              name="proveedor"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                placeholder="Escribe o selecciona un proveedor"
                optionFilterProp="children"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Input
                        placeholder="Nuevo proveedor"
                        value={nuevoProveedor}
                        onChange={(e) => setNuevoProveedor(e.target.value)}
                      />
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={agregarNuevoProveedor}
                      >
                        Agregar
                      </Button>
                    </Space>
                  </>
                )}
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                }
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

        {/* 🔹 Color, Unidad de medida, Código Interno */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Color" name="color *" rules={[{ required: true }]}>
              <Input placeholder="Ej: #FFFFFF o Azul" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Unidad de Medida *" name="unidadMedida" rules={[{ required: true }]}>
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

          <Col span={8}>
            <Form.Item label="Código Interno" name="codigoInterno" valuePropName="checked">
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>

        {/* 🔹 Botón Guardar */}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Guardar Material
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AgregarMaterial;