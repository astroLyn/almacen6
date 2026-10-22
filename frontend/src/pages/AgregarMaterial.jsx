import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Switch,
  message,
  Row,
  Col,
  Divider,
  Upload,
  Grid,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import api from "../api/axiosConfig";

const { Option } = Select;
const { useBreakpoint } = Grid;

const AgregarMaterial = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = !screens.md; // true si < 768px

  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [imagenArchivo, setImagenArchivo] = useState(null);

  // 🌟 CONFIGURACIÓN DEL COMPONENTE UPLOAD
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

  // 📤 Enviar datos al backend
  const onFinish = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        codigoInterno: values.codigoInterno || false,
        stockActual: parseFloat(values.stockActual),
        stockMinimo: parseFloat(values.stockMinimo),
      };

      const res = await api.post("/materiales", payload);

      if (imagenArchivo) {
        const formData = new FormData();
        formData.append("imagen", imagenArchivo);
        await api.post(
          `/materiales/${values.codigoMaterial}/imagen`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      message.success(res.data.message || "✅ Material e imagen agregados correctamente");
      form.resetFields();
      setImagenArchivo(null);
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
          api.get("/categorias"),
          api.get("/ubicaciones"),
          api.get("/proveedores"),
          api.get("/marcas"),
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

  const agregarNuevaMarca = async () => {
    if (!nuevaMarca.trim()) {
      message.warning("Escribe un nombre para la nueva marca");
      return;
    }
    try {
      const res = await api.post("/marcas", { nombre: nuevaMarca });
      const nueva = res.data?.codigo
        ? res.data
        : { codigo: res.data.insertId || Date.now(), nombre: nuevaMarca };
      setMarcas([...marcas, nueva]);
      message.success("Marca agregada correctamente");
      setNuevaMarca("");
    } catch {
      message.error("No se pudo agregar la marca");
    }
  };

  const agregarNuevoProveedor = async () => {
    if (!nuevoProveedor.trim()) {
      message.warning("Escribe un nombre para el nuevo proveedor");
      return;
    }
    try {
      const res = await api.post("/proveedores", { nombre: nuevoProveedor });
      const nuevo = res.data?.codigo
        ? res.data
        : { codigo: res.data.insertId || Date.now(), nombre: nuevoProveedor };
      setProveedores([...proveedores, nuevo]);
      message.success("Proveedor agregado correctamente");
      setNuevoProveedor("");
    } catch {
      message.error("No se pudo agregar el proveedor");
    }
  };

  // 🔁 Helper: render del bloque "agregar nuevo" en los Selects
  const renderAgregarExtra = (value, setValue, onAdd, placeholder) => (
    <>
      <Divider style={{ margin: "8px 0" }} />
      <div
        style={{
          padding: "0 8px 8px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 8,
        }}
      >
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={onAdd}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAdd}
          block={isMobile}
        >
          Agregar
        </Button>
      </div>
    </>
  );

  return (
    <div
      style={{
        background: "#fff",
        padding: isMobile ? "16px 12px" : "24px 16px",
        borderRadius: 10,
      }}
    >
      <h2 style={{ marginBottom: 20, fontSize: isMobile ? 20 : 24 }}>
        Agregar Nuevo Material
      </h2>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size={isMobile ? "large" : "middle"} // 🔥 inputs más cómodos en móvil
      >
        {/* Código + Categoría */}
        <Row gutter={{ xs: 0, md: 16 }}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Código *"
              name="codigoMaterial"
              rules={[{ required: true, message: "El código es obligatorio" }]}
            >
              <Input placeholder="Ej: MAT-001" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Categoría *"
              name="categoria"
              rules={[{ required: true, message: "Selecciona una categoría" }]}
            >
              <Select
                placeholder="Selecciona una categoría"
                loading={!categorias.length}
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
        </Row>

        {/* Descripción */}
        <Form.Item
          label="Descripción *"
          name="descripcion"
          rules={[{ required: true, message: "La descripción es obligatoria" }]}
        >
          <Input placeholder="Descripción detallada del material" />
        </Form.Item>

        <Form.Item label="Notas / Especificaciones" name="observaciones">
          <Input.TextArea
            placeholder="Información adicional, especificaciones técnicas, etc."
            autoSize={{ minRows: 2, maxRows: 5 }}
          />
        </Form.Item>

        {/* Stock */}
        <Row gutter={{ xs: 0, md: 16 }}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Stock Actual *"
              name="stockActual"
              initialValue={0}
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Stock Mínimo *"
              name="stockMinimo"
              initialValue={0}
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Ubicación / Marca / Proveedor */}
        <Row gutter={{ xs: 0, md: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item
              label="Ubicación en Almacén *"
              name="ubicacion"
              rules={[{ required: true, message: "Selecciona una ubicación" }]}
            >
              <Select
                showSearch
                placeholder="Escribe o selecciona una ubicación"
                optionFilterProp="children"
              >
                {ubicaciones.map((u) => {
                  const valor = u.codigoUbicacion || u.codigo || u.id;
                  const texto = u.nombre || u.descripcion || u.ubicacion;
                  return (
                    <Option key={valor} value={valor}>
                      {texto}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Form.Item
              label="Marca *"
              name="marca"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                placeholder="Escribe o selecciona una marca"
                optionFilterProp="children"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {renderAgregarExtra(
                      nuevaMarca,
                      setNuevaMarca,
                      agregarNuevaMarca,
                      "Nueva marca"
                    )}
                  </>
                )}
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

          <Col xs={24} md={24} lg={8}>
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
                    {renderAgregarExtra(
                      nuevoProveedor,
                      setNuevoProveedor,
                      agregarNuevoProveedor,
                      "Nuevo proveedor"
                    )}
                  </>
                )}
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

        {/* Color / Unidad / Código Interno */}
        <Row gutter={{ xs: 0, md: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item
              label="Color *"
              name="color"
              rules={[{ required: true, message: "El color es obligatorio" }]}
            >
              <Input placeholder="Ej: Azul, Rojo, #FFFFFF" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12} lg={8}>
            <Form.Item
              label="Unidad de Medida *"
              name="unidadMedida"
              rules={[{ required: true, message: "La unidad de medida es obligatoria" }]}
            >
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

          <Col xs={24} md={24} lg={8}>
            <Form.Item
              label="Código Interno"
              name="codigoInterno"
              valuePropName="checked"
            >
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>

        {/* Imagen */}
        <Row style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Form.Item label="Fotografía del Material (Opcional)">
              <Upload {...propsSubida}>
                <Button icon={<UploadOutlined />} block={isMobile}>
                  Seleccionar Imagen (JPG/PNG)
                </Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        {/* Submit */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{ width: "100%" }}
          >
            Guardar Material
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AgregarMaterial;