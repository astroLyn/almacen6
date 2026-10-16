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
  Space,
  Upload
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import api from "../api/axiosConfig";

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

  const [imagenArchivo, setImagenArchivo] = useState(null);

  // 🌟 CONFIGURACIÓN DEL COMPONENTE UPLOAD
  const propsSubida = {
    beforeUpload: (file) => {
      // Validamos que sea una imagen
      const esImagen = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!esImagen) {
        message.error('¡Solo puedes subir archivos de imagen (JPG, PNG, WEBP)!');
        return Upload.LIST_IGNORE;
      }
      // Guardamos el archivo en el estado y detenemos la subida automática
      setImagenArchivo(file);
      return false; 
    },
    onRemove: () => {
      setImagenArchivo(null); // Si el usuario se arrepiente y la borra
    },
    maxCount: 1, // Solo permitimos 1 foto por material
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

      // 1️⃣ PASO 1: Creamos el material en la base de datos
      const res = await api.post("/materiales", payload);

      // 2️⃣ PASO 2: Si el usuario seleccionó una imagen, la subimos
      if (imagenArchivo) {
        const formData = new FormData();
        formData.append("imagen", imagenArchivo); // "imagen" es el nombre que espera multer en el backend

        await api.post(`/materiales/${values.codigoMaterial}/imagen`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      message.success(res.data.message || "✅ Material e imagen agregados correctamente");
      form.resetFields();
      setImagenArchivo(null); // Limpiamos la imagen seleccionada

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
      const nueva = res.data?.codigo ? res.data : { codigo: res.data.insertId || Date.now(), nombre: nuevaMarca };
      setMarcas([...marcas, nueva]);
      message.success("Marca agregada correctamente");
      setNuevaMarca("");
    } catch (error) {
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
      const nuevo = res.data?.codigo ? res.data : { codigo: res.data.insertId || Date.now(), nombre: nuevoProveedor };
      setProveedores([...proveedores, nuevo]);
      message.success("Proveedor agregado correctamente");
      setNuevoProveedor("");
    } catch (error) {
      message.error("No se pudo agregar el proveedor");
    }
  };

  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 10 }}>
      <h2 style={{ marginBottom: 20 }}>Agregar Nuevo Material</h2>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Código *" name="codigoMaterial" rules={[{ required: true, message: "El código es obligatorio" }]}>
              <Input placeholder="Ej: MAT-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Categoría *" name="categoria" rules={[{ required: true, message: "Selecciona una categoría" }]}>
              <Select placeholder="Selecciona una categoría" loading={!categorias.length}>
                {categorias.map((cat) => (
                  <Option key={cat.codigo || cat.claveCategoria} value={cat.codigo || cat.claveCategoria}>{cat.categoria || cat.nombre}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Descripción *" name="descripcion" rules={[{ required: true, message: "La descripción es obligatoria" }]}>
          <Input placeholder="Descripción detallada del material" />
        </Form.Item>

        <Form.Item label="Notas / Especificaciones" name="observaciones">
          <Input.TextArea placeholder="Información adicional, especificaciones técnicas, etc." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Stock Actual *" name="stockActual" initialValue={0} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Stock Mínimo *" name="stockMinimo" initialValue={0} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Ubicación en Almacén *" name="ubicacion" rules={[{ required: true, message: "Selecciona una ubicación" }]}>
              <Select showSearch placeholder="Escribe o selecciona una ubicación" optionFilterProp="children">
                {ubicaciones.map((u) => {
                  const valor = u.codigoUbicacion || u.codigo || u.id;
                  const texto = u.nombre || u.descripcion || u.ubicacion;
                  return <Option key={valor} value={valor}>{texto}</Option>;
                })}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Marca *" name="marca" rules={[{ required: true }]}>
              <Select showSearch placeholder="Escribe o selecciona una marca" optionFilterProp="children" dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Input placeholder="Nueva marca" value={nuevaMarca} onChange={(e) => setNuevaMarca(e.target.value)} />
                      <Button type="text" icon={<PlusOutlined />} onClick={agregarNuevaMarca}>Agregar</Button>
                    </Space>
                  </>
                )}>
                {marcas.map((m) => {
                  const valor = m.claveMarca || m.codigo || m.id;
                  const texto = m.nombre || m.descripcion || m.marca;
                  return <Option key={valor} value={valor}>{texto}</Option>;
                })}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Proveedor *" name="proveedor" rules={[{ required: true }]}>
              <Select showSearch placeholder="Escribe o selecciona un proveedor" optionFilterProp="children" dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "8px 0" }} />
                    <Space style={{ padding: "0 8px 4px" }}>
                      <Input placeholder="Nuevo proveedor" value={nuevoProveedor} onChange={(e) => setNuevoProveedor(e.target.value)} />
                      <Button type="text" icon={<PlusOutlined />} onClick={agregarNuevoProveedor}>Agregar</Button>
                    </Space>
                  </>
                )}>
                {proveedores.map((p) => <Option key={p.codigo} value={p.codigo}>{p.nombre}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Color *" name="color" rules={[{ required: true, message: "El color es obligatorio" }]}>
              <Input placeholder="Ej: Azul, Rojo, #FFFFFF" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Unidad de Medida *" name="unidadMedida" rules={[{ required: true, message: "La unidad de medida es obligatoria" }]}>
              <Select placeholder="Selecciona unidad">
                <Option value="Pieza">Pieza</Option><Option value="Rollo">Rollo</Option><Option value="Metro">Metro</Option>
                <Option value="Caja">Caja</Option><Option value="Kit">Kit</Option><Option value="Bolsa">Bolsa</Option>
                <Option value="Bote">Bote</Option><Option value="Pie">Pie</Option><Option value="Otro">Otro</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Código Interno" name="codigoInterno" valuePropName="checked">
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>

        {/* 🌟 NUEVO: Zona de carga de imagen */}
        <Row style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Form.Item label="Fotografía del Material (Opcional)">
              <Upload {...propsSubida}>
                <Button icon={<UploadOutlined />}>Seleccionar Imagen (JPG/PNG)</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            Guardar Material
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AgregarMaterial;