import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Alert,
  Layout,
  Row,
  Col,
  Checkbox,
  message,
  notification
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ShopOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from "../context/AuthContext.jsx";
import "../css/login.css";

const { Title, Text, Link } = Typography;
const { Content } = Layout;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form] = Form.useForm();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    setErrorVisible(false); // Ocultar error anterior
    
    try {
      console.log('🔐 Intentando login con:', { 
        username: values.username, 
        remember: values.remember 
      });

      await login(values.username, values.password);
      
      console.log('✅ Login exitoso');
      
      // Si marcó "Recordar sesión", guardar en localStorage
      if (values.remember) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
    } catch (error) {
      console.error('❌ Error completo en login:', error);
      
      // DETERMINAR EL MENSAJE DE ERROR
      let userErrorMessage = 'Error al iniciar sesión';
      
      if (error.response?.data?.detalle) {
        userErrorMessage = error.response.data.detalle;
      } else if (error.response?.status === 401) {
        userErrorMessage = 'Usuario o contraseña incorrectos';
      } else if (error.response?.status === 400) {
        userErrorMessage = 'Complete todos los campos requeridos';
      } else if (error.message) {
        userErrorMessage = error.message;
      }

      // OPCIÓN 1: Usar notification (más visible)
      notification.error({
        message: 'Error de autenticación',
        description: userErrorMessage,
        placement: 'topRight',
        duration: 5,
      });

      // OPCIÓN 2: Usar Alert integrado en el formulario
      setErrorMessage(userErrorMessage);
      setErrorVisible(true);

      // OPCIÓN 3: También mantener message.error como fallback
      message.error(userErrorMessage);
      
      // Limpiar la contraseña
      form.setFieldsValue({ password: '' });
      
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('❌ Error en validación de formulario:', errorInfo);
    message.warning('Por favor complete correctamente todos los campos');
  };

  // Función para limpiar el formulario completamente
  const limpiarFormulario = () => {
    form.resetFields();
    setErrorVisible(false);
    message.info('Formulario limpiado');
  };

  // Manejar el evento de presionar Enter en campos específicos
  const handleKeyPress = (e, fieldName) => {
    if (e.key === 'Enter') {
      if (fieldName === 'username') {
        // Al presionar Enter en usuario, ir a contraseña
        const passwordInput = form.getFieldInstance('password');
        if (passwordInput) {
          passwordInput.focus();
        }
      } else if (fieldName === 'password') {
        // Al presionar Enter en contraseña, enviar formulario
        form.submit();
      }
    }
  };

  // Cargar "Recordar sesión" si estaba guardado
  React.useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
      form.setFieldValue('remember', true);
    }
  }, [form]);

  return (
    <Layout className="login-layout">
      <Content className="login-content">
        <Row justify="center" align="middle" className="login-row">
          <Col xs={22} sm={18} md={12} lg={10} xl={8}>
            <Card className="login-card">
              {/* Header del Login */}
              <div className="login-header">
                <div className="logo-section">
                  <div className="logo-icon">
                    <ShopOutlined />
                  </div>
                  <div className="logo-text">
                    <Title level={3} className="company-name">
                      Sistema de Almacén
                    </Title>
                    <Text type="secondary" className="company-slogan">
                      Gestión Inteligente de Inventarios
                    </Text>
                  </div>
                </div>
              </div>

              <Divider />

              {/* MOSTRAR ALERTA DE ERROR SI EXISTE */}
              {errorVisible && (
                <Alert
                  message="Error de autenticación"
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setErrorVisible(false)}
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Formulario de Login */}
              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
                size="large"
                layout="vertical"
                initialValues={{
                  remember: false
                }}
              >
                <Form.Item
                  label="Usuario"
                  name="username"
                  rules={[
                    { 
                      required: true, 
                      message: 'Por favor ingrese su nombre de usuario' 
                    },
                    {
                      min: 3,
                      message: 'El usuario debe tener al menos 3 caracteres'
                    }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined className="input-prefix" />}
                    placeholder="Ingrese su usuario"
                    className="login-input"
                    autoComplete="username"
                    onKeyPress={(e) => handleKeyPress(e, 'username')}
                    autoFocus
                  />
                </Form.Item>

                <Form.Item
                  label="Contraseña"
                  name="password"
                  rules={[
                    { 
                      required: true, 
                      message: 'Por favor ingrese su contraseña' 
                    },
                    {
                      min: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="input-prefix" />}
                    placeholder="Ingrese su contraseña"
                    className="login-input"
                    iconRender={(visible) => 
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    autoComplete="current-password"
                    onKeyPress={(e) => handleKeyPress(e, 'password')}
                  />
                </Form.Item>

                <div className="login-options">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Recordar sesión</Checkbox>
                  </Form.Item>
                </div>

                <Form.Item>
                  <Space.Compact style={{ width: '100%' }}>
                    <Button
                      type="default"
                      onClick={limpiarFormulario}
                      style={{ width: '30%' }}
                      disabled={loading}
                    >
                      Limpiar
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="login-button"
                      loading={loading}
                      style={{ width: '70%' }}
                    >
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </Space.Compact>
                </Form.Item>
              </Form>

              {/* Información adicional */}
              <div className="login-footer">
                <Divider plain>
                  <Text type="secondary" className="divider-text">
                    <SafetyCertificateOutlined /> Acceso Seguro
                  </Text>
                </Divider>
                
                <div className="system-info">
                  <Row gutter={[16, 8]} justify="center">
                    <Col span={24}>
                      <Text type="secondary" className="version-info">
                        v2.1.0 • Sistema de Gestión de Almacén
                      </Text>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Login;