import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Typography,
  Tag,
  Space,
  message,
  DatePicker,
  Steps,
  Divider,
  Checkbox,
  List,
} from "antd";
import {
  PlusOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  ShoppingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const MaterialApartado = () => {
  const [apartados, setApartados] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [agregarMaterialVisible, setAgregarMaterialVisible] = useState(false);
  const [apartadoSeleccionado, setApartadoSeleccionado] = useState(null);
  const [apartadoDetalle, setApartadoDetalle] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [materialesAgregados, setMaterialesAgregados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [formMaterial] = Form.useForm();

  // 🔹 Obtener datos iniciales
  useEffect(() => {
    obtenerApartados();
    obtenerMateriales();
    obtenerClientes();
  }, []);

  const obtenerApartados = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/material-apartado");
      setApartados(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar los apartados.");
    }
  };

  const obtenerMateriales = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/materiales");
      setMateriales(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerClientes = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar clientes");
    }
  };

  // 🔹 Crear nuevo apartado (solo encabezado)
  const crearApartado = async (values) => {
    setLoading(true);
    try {
      const payload = {
        OS: values.OS || null,
        fecha: values.fecha.format("YYYY-MM-DD"),
        cotizacion: values.cotizacion,
        cliente: values.cliente,
        estado: "ACT"
      };

      console.log("📤 Enviando datos del apartado:", payload);

      const response = await axios.post("http://localhost:3000/api/material-apartado", payload);
      
      const noApartado = response.data.noApartado;
      
      if (!noApartado) {
        console.error("❌ No se recibió noApartado en la respuesta:", response.data);
        message.error("Error: No se pudo obtener el número de apartado");
        return;
      }

      console.log("✅ Apartado creado exitosamente, noApartado:", noApartado);

      message.success("Apartado creado exitosamente");
      
      // Pasar al paso de agregar materiales
      setApartadoSeleccionado(noApartado);
      setCurrentStep(1);
      setMaterialesAgregados([]); // Limpiar materiales anteriores
      
      console.log("🔄 Estado actualizado - apartadoSeleccionado:", noApartado);
      
    } catch (err) {
      console.error("❌ Error completo:", err);
      console.error("❌ Respuesta del error:", err.response?.data);
      message.error(`Error al crear apartado: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Agregar material a apartado existente
  const agregarMaterial = async (values) => {
    setLoading(true);
    console.log("🎯 agregarMaterial llamado con:", values);
    console.log("🔍 apartadoSeleccionado:", apartadoSeleccionado);
    
    if (!apartadoSeleccionado) {
      console.error("❌ apartadoSeleccionado es null o undefined");
      message.error("No hay apartado seleccionado. Por favor, cree un apartado primero.");
      setLoading(false);
      return;
    }

    try {
      console.log("📤 Agregando material al backend:", {
        apartado: apartadoSeleccionado,
        material: values
      });

      const url = `http://localhost:3000/api/material-apartado/${apartadoSeleccionado}/materiales`;
      console.log("🔗 URL de la petición:", url);

      const response = await axios.post(url, {
        codigoMaterial: values.codigoMaterial,
        cantidad: values.cantidad,
        observaciones: values.observaciones,
        alerta: values.alerta || false
      });

      console.log("✅ Respuesta del servidor:", response.data);
      
      // Obtener información del material para mostrar en la lista
      const materialInfo = materiales.find(m => m.codigoMaterial === values.codigoMaterial);
      const nuevoMaterial = {
        codigoMaterial: values.codigoMaterial,
        descripcion: materialInfo?.descripcion || 'Descripción no disponible',
        cantidad: values.cantidad,
        observaciones: values.observaciones,
        alerta: values.alerta || false,
        unidadMedida: materialInfo?.unidadMedida || 'N/A'
      };

      // Agregar a la lista local
      setMaterialesAgregados(prev => [...prev, nuevoMaterial]);

      message.success("Material agregado al apartado");
      formMaterial.resetFields();
      
      // Manejar acción según el botón presionado
      const debeFinalizar = values.finalizar;
      console.log("🔍 debeFinalizar:", debeFinalizar);
      
      if (debeFinalizar) {
        setAgregarMaterialVisible(false);
        setModalVisible(false);
        setCurrentStep(0);
        setApartadoSeleccionado(null);
        form.resetFields();
        obtenerApartados();
        message.success("Apartado completado exitosamente");
      } else {
        setAgregarMaterialVisible(false);
        message.info("Puede continuar agregando más materiales");
      }
      
    } catch (err) {
      console.error("❌ Error completo al agregar material:", err);
      console.error("❌ Respuesta del error:", err.response?.data);
      
      // Manejar errores específicos del backend
      let errorMessage = "Error al agregar material";
      if (err.response?.data?.detalle) {
        errorMessage = err.response.data.detalle;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Agregar material desde el modal de detalle
  const agregarMaterialDesdeDetalle = async (values) => {
    setLoading(true);
    console.log("🎯 agregarMaterialDesdeDetalle llamado con:", values);
    
    if (!apartadoDetalle?.noApartado) {
      message.error("No hay apartado seleccionado");
      setLoading(false);
      return;
    }

    try {
      console.log("📤 Agregando material desde detalle:", {
        apartado: apartadoDetalle.noApartado,
        material: values
      });

      await axios.post(
        `http://localhost:3000/api/material-apartado/${apartadoDetalle.noApartado}/materiales`,
        {
          codigoMaterial: values.codigoMaterial,
          cantidad: values.cantidad,
          observaciones: values.observaciones,
          alerta: values.alerta || false
        }
      );

      message.success("Material agregado al apartado");
      formMaterial.resetFields();
      setAgregarMaterialVisible(false);
      
      // Recargar el detalle para mostrar el nuevo material
      const res = await axios.get(`http://localhost:3000/api/material-apartado/${apartadoDetalle.noApartado}`);
      setApartadoDetalle(res.data);
      obtenerApartados();
    } catch (err) {
      console.error("❌ Error completo al agregar material:", err);
      console.error("❌ Respuesta del error:", err.response?.data);
      
      let errorMessage = "Error al agregar material";
      if (err.response?.data?.detalle) {
        errorMessage = err.response.data.detalle;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Ver detalle completo de un apartado
  const verDetalle = async (apartado) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/material-apartado/${apartado.noApartado}`);
      setApartadoDetalle(res.data);
      setDetalleVisible(true);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar detalle del apartado");
    }
  };

  // 🔹 Dar salida al apartado
  const darSalida = async (noApartado) => {
    setLoading(true);
    try {
      console.log("📤 Generando salida para apartado:", noApartado);
      
      const response = await axios.post(`http://localhost:3000/api/material-apartado/${noApartado}/generar-salida`);
      
      message.success(`Salida #${response.data.noSalida} generada exitosamente`);
      setDetalleVisible(false);
      obtenerApartados();
    } catch (err) {
      console.error("❌ Error al generar salida:", err);
      console.error("❌ Respuesta del error:", err.response?.data);
      
      let errorMessage = "Error al generar salida";
      if (err.response?.data?.detalle) {
        errorMessage = err.response.data.detalle;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Eliminar material de apartado
  const eliminarMaterial = async (noApartado, codigoMaterial) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:3000/api/material-apartado/${noApartado}/materiales/${codigoMaterial}`);
      message.success("Material eliminado del apartado");
      
      // Recargar detalle
      if (apartadoDetalle) {
        const res = await axios.get(`http://localhost:3000/api/material-apartado/${noApartado}`);
        setApartadoDetalle(res.data);
      }
      
      obtenerApartados();
    } catch (err) {
      console.error(err);
      
      let errorMessage = "Error al eliminar material";
      if (err.response?.data?.detalle) {
        errorMessage = err.response.data.detalle;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Eliminar material de la lista local (durante creación)
  const eliminarMaterialLocal = (codigoMaterial) => {
    setMaterialesAgregados(prev => 
      prev.filter(material => material.codigoMaterial !== codigoMaterial)
    );
    message.success("Material removido de la lista");
  };

  // 🔹 Resetear modal de creación
  const resetearCreacion = () => {
    setModalVisible(false);
    setCurrentStep(0);
    setApartadoSeleccionado(null);
    setMaterialesAgregados([]);
    form.resetFields();
    formMaterial.resetFields();
  };

  // 🔹 Función para filtrar materiales en el Select
  const filtrarMateriales = (input, option) => {
    const materialText = `${option.children}`.toLowerCase();
    return materialText.includes(input.toLowerCase());
  };

  // 🔹 Función para filtrar clientes en el Select
  const filtrarClientes = (input, option) => {
    const clienteText = `${option.children}`.toLowerCase();
    return clienteText.includes(input.toLowerCase());
  };

  // 🔹 Manejar el envío del formulario de materiales
  const manejarEnvioMaterial = (values) => {
    console.log("📝 Formulario de material enviado:", values);
    console.log("🔍 apartadoDetalle:", apartadoDetalle);
    console.log("🔍 apartadoSeleccionado:", apartadoSeleccionado);
    
    if (apartadoDetalle) {
      console.log("🔍 Llamando agregarMaterialDesdeDetalle");
      agregarMaterialDesdeDetalle(values);
    } else {
      console.log("🔍 Llamando agregarMaterial");
      agregarMaterial(values);
    }
  };

  // 🔹 Columnas principales
  const columnas = [
    {
      title: "No. Apartado",
      dataIndex: "noApartado",
      key: "noApartado",
      render: (noApartado) => <Tag color="blue">#{noApartado}</Tag>,
    },
    {
      title: "Cotización",
      dataIndex: "cotizacion",
      key: "cotizacion",
      render: (cotizacion) => <Text strong>{cotizacion}</Text>,
    },
    {
      title: "Cliente",
      dataIndex: "nombreCliente",
      key: "nombreCliente",
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (fecha) => dayjs(fecha).format("DD/MM/YYYY"),
    },
    {
      title: "Materiales",
      dataIndex: "totalMateriales",
      key: "totalMateriales",
      align: "center",
      render: (cant) => <Tag color={cant > 0 ? "blue" : "red"}>{cant}</Tag>,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado, record) => (
        <Space>
          <Tag color={estado === "ACT" ? "green" : "red"}>
            {estado === "ACT" ? "Activo" : "Inactivo"}
          </Tag>
          {record.darSalida && <Tag color="orange">Salida Generada</Tag>}
        </Space>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<ArrowRightOutlined />}
            onClick={() => verDetalle(record)}
          >
            Detalle
          </Button>
          {!record.darSalida && record.totalMateriales > 0 && (
            <Button
              type="primary"
              size="small"
              onClick={() => darSalida(record.noApartado)}
              loading={loading}
            >
              Dar Salida
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3}>
            <ShoppingOutlined style={{ marginRight: 12 }} />
            Material Apartado
          </Title>
          <Text type="secondary">
            Control de materiales reservados para cotizaciones o proyectos.
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            loading={loading}
          >
            Nuevo Apartado
          </Button>
        </Col>
      </Row>

      {/* 🧾 Tabla de Apartados */}
      <Card>
        <Table
          columns={columnas}
          dataSource={apartados}
          rowKey="noApartado"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      {/* 📦 Modal Crear Apartado (Multi-paso) */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {currentStep === 0 ? "Crear Apartado" : "Agregar Materiales"}
          </Space>
        }
        open={modalVisible}
        onCancel={resetearCreacion}
        footer={null}
        width={700}
        maskClosable={false}
        style={{ top: 20 }}
        zIndex={1000}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Datos Básicos" />
          <Step title="Agregar Materiales" />
        </Steps>

        {currentStep === 0 && (
          <Form
            form={form}
            layout="vertical"
            onFinish={crearApartado}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="OS"
                  name="OS"
                >
                  <Input placeholder="Número de OS (opcional)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Cotización"
                  name="cotizacion"
                  rules={[{ required: true, message: "Ingrese la cotización" }]}
                >
                  <Input placeholder="Número de cotización" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true, message: "Seleccione la fecha" }]}
            >
              <DatePicker 
                style={{ width: "100%" }} 
                format="DD/MM/YYYY"
                defaultValue={dayjs()}
              />
            </Form.Item>

            <Form.Item
              label="Cliente"
              name="cliente"
              rules={[{ required: true, message: "Seleccione un cliente" }]}
            >
              <Select 
                placeholder="Seleccione un cliente"
                showSearch
                filterOption={filtrarClientes}
                optionFilterProp="children"
                loading={loading}
              >
                {clientes.map((cliente) => (
                  <Option key={cliente.claveCliente} value={cliente.claveCliente}>
                    {cliente.nombreFiscal || cliente.nombre} - {cliente.claveCliente}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Button type="primary" htmlType="submit" loading={loading}>
                Continuar a Materiales
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Apartado #{apartadoSeleccionado || 'No disponible'}</Text>
              <br />
              <Text type="secondary">Agregue los materiales a este apartado</Text>
            </div>

            {/* Lista de materiales agregados */}
            {materialesAgregados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Materiales agregados:</Text>
                <List
                  size="small"
                  bordered
                  dataSource={materialesAgregados}
                  renderItem={(material) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => eliminarMaterialLocal(material.codigoMaterial)}
                          disabled={loading}
                        >
                          Quitar
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={`${material.codigoMaterial} - ${material.descripcion}`}
                        description={
                          <Space>
                            <Text>Cantidad: {material.cantidad} {material.unidadMedida}</Text>
                            {material.alerta && <Tag color="red">Alerta</Tag>}
                            {material.observaciones && (
                              <Text type="secondary">Obs: {material.observaciones}</Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                  style={{ marginTop: 8 }}
                />
              </div>
            )}

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                console.log("🔄 Botón 'Agregar Material' clickeado, apartadoSeleccionado:", apartadoSeleccionado);
                setAgregarMaterialVisible(true);
              }}
              style={{ width: "100%", marginBottom: 16 }}
              loading={loading}
            >
              Agregar Material
            </Button>

            <Button 
              type="primary" 
              onClick={resetearCreacion}
              style={{ width: "100%" }}
              loading={loading}
            >
              Finalizar
            </Button>
          </div>
        )}
      </Modal>

      {/* ➕ Modal Agregar Material */}
      <Modal
        title="Agregar Material al Apartado"
        open={agregarMaterialVisible}
        onCancel={() => setAgregarMaterialVisible(false)}
        footer={null}
        width={500}
        style={{ top: 100 }}
        zIndex={2000}
      >
        <Form
          form={formMaterial}
          layout="vertical"
          onFinish={manejarEnvioMaterial}
          onFinishFailed={(errorInfo) => {
            console.error("❌ Error en formulario:", errorInfo);
            message.error("Por favor complete todos los campos requeridos");
          }}
          initialValues={{ finalizar: false }}
        >
          <Form.Item
            label="Material"
            name="codigoMaterial"
            rules={[{ required: true, message: "Seleccione un material" }]}
          >
            <Select 
              placeholder="Buscar material por código o descripción"
              showSearch
              filterOption={filtrarMateriales}
              optionFilterProp="children"
              loading={loading}
            >
              {materiales.map((m) => (
                <Option key={m.codigoMaterial} value={m.codigoMaterial}>
                  {m.codigoMaterial} - {m.descripcion}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Cantidad"
            name="cantidad"
            rules={[{ required: true, message: "Ingrese la cantidad" }]}
          >
            <InputNumber 
              min={0.01} 
              step={0.01} 
              style={{ width: "100%" }} 
              placeholder="0.00"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item label="Observaciones" name="observaciones">
            <Input.TextArea 
              placeholder="Observaciones adicionales" 
              rows={3}
              disabled={loading}
            />
          </Form.Item>

          <Form.Item name="alerta" valuePropName="checked" initialValue={false}>
            <Checkbox disabled={loading}>Activar alerta</Checkbox>
          </Form.Item>

          <Form.Item name="finalizar" hidden>
            <Input />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Button 
                onClick={() => {
                  console.log("🔄 Botón 'Agregar y Continuar' clickeado");
                  formMaterial.setFieldsValue({ finalizar: false });
                  formMaterial.submit();
                }}
                disabled={loading}
              >
                Agregar y Continuar
              </Button>
              <Button 
                type="primary"
                onClick={() => {
                  console.log("🔄 Botón 'Agregar y Finalizar' clickeado");
                  formMaterial.setFieldsValue({ finalizar: true });
                  formMaterial.submit();
                }}
                loading={loading}
              >
                Agregar y Finalizar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 🔍 Modal Detalle Apartado */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Apartado #{apartadoDetalle?.noApartado} - {apartadoDetalle?.cotizacion}
          </Space>
        }
        open={detalleVisible}
        onCancel={() => setDetalleVisible(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {apartadoDetalle && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>Cliente: </Text> 
                <Text>{apartadoDetalle.nombreCliente}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Fecha: </Text> 
                <Text>{dayjs(apartadoDetalle.fecha).format("DD/MM/YYYY")}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>OS: </Text> 
                <Text>{apartadoDetalle.OS || "No especificada"}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Estado: </Text> 
                <Tag color={apartadoDetalle.estado === "ACT" ? "green" : "red"}>
                  {apartadoDetalle.nombreEstado}
                </Tag>
                {apartadoDetalle.darSalida && <Tag color="orange">Salida Generada</Tag>}
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong>Materiales del Apartado</Text>
              <Space>
                {!apartadoDetalle.darSalida && (
                  <>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => setAgregarMaterialVisible(true)}
                      loading={loading}
                    >
                      Agregar Material
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => darSalida(apartadoDetalle.noApartado)}
                      loading={loading}
                    >
                      Generar Salida
                    </Button>
                  </>
                )}
              </Space>
            </div>

            {/* Tabla de materiales en el apartado */}
            <Table
              dataSource={apartadoDetalle.materiales || []}
              columns={[
                {
                  title: "Código",
                  dataIndex: "codigoMaterial",
                  key: "codigoMaterial",
                },
                {
                  title: "Descripción",
                  dataIndex: "descripcion",
                  key: "descripcion",
                },
                {
                  title: "Cantidad",
                  dataIndex: "cantidad",
                  key: "cantidad",
                  align: "center",
                  render: (cantidad) => <Text strong>{cantidad}</Text>,
                },
                {
                  title: "Unidad",
                  dataIndex: "unidadMedida",
                  key: "unidadMedida",
                  align: "center",
                },
                {
                  title: "Stock Actual",
                  dataIndex: "stockActual",
                  key: "stockActual",
                  align: "center",
                  render: (stock) => <Text type={stock < 10 ? "danger" : undefined}>{stock}</Text>,
                },
                {
                  title: "Stock Reservado",
                  dataIndex: "stockReservado",
                  key: "stockReservado",
                  align: "center",
                  render: (stock) => <Text strong>{stock}</Text>,
                },
                {
                  title: "Alerta",
                  dataIndex: "alerta",
                  key: "alerta",
                  align: "center",
                  render: (alerta) => (
                    <Tag color={alerta ? "red" : "green"}>
                      {alerta ? "Sí" : "No"}
                    </Tag>
                  ),
                },
                {
                  title: "Observaciones",
                  dataIndex: "observaciones",
                  key: "observaciones",
                  ellipsis: true,
                },
                {
                  title: "Acciones",
                  key: "acciones",
                  render: (_, record) => (
                    !apartadoDetalle.darSalida && (
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        size="small"
                        onClick={() => eliminarMaterial(apartadoDetalle.noApartado, record.codigoMaterial)}
                        loading={loading}
                      >
                        Eliminar
                      </Button>
                    )
                  ),
                },
              ]}
              pagination={false}
              bordered
              size="small"
              rowKey="codigoMaterial"
              loading={loading}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default MaterialApartado;