import jwt from "jsonwebtoken";

// 🛡️ 1. Verificar Identidad (¿Quién eres?)
export const verificarToken = (req, res, next) => {
  // Permitir preflight CORS sin token
  if (req.method === 'OPTIONS') {
    console.log('🔷 Backend - Preflight OPTIONS permitido');
    return next();
  }

  const authHeader = req.headers["authorization"];
  console.log('🔍 Backend - Authorization header recibido:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');
  const token = authHeader && authHeader.split(" ")[1]; // Soporta 'Bearer <token>'

  if (!token) {
    console.log('❌ Backend - No se encontró token en el header');
    return res.status(401).json({ 
      error: "Acceso denegado", 
      detalle: "No se encontró un token de sesión activo." 
    });
  }

  console.log('✅ Backend - Token extraído:', token.substring(0, 20) + '...');

  try {
    // 🔒 Usamos estrictamente la variable de entorno definida en Docker
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Backend - Token verificado, usuario:', decoded.nombreUsuario, 'acceso:', decoded.acceso);
    
    // Inyectamos los datos decodificados (nombreUsuario, acceso) en la petición
    req.usuario = decoded; 
    
    next();
  } catch (error) {
    console.error("❌ Error de validación JWT:", error.message);
    return res.status(403).json({ 
      error: "Sesión inválida", 
      detalle: "Tu sesión ha expirado o el token es corrupto. Por favor, inicia sesión de nuevo." 
    });
  }
};

// 📛 2. Verificar Permisos (¿Puedes estar aquí?)
export const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    // Validamos que la identificación previa (verificarToken) haya ocurrido
    if (!req.usuario) {
      return res.status(500).json({ error: "Error interno de seguridad" });
    }

    const rolUsuario = req.usuario.acceso;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ 
        error: "Acceso restringido",
        detalle: `El rol '${rolUsuario}' no tiene los permisos necesarios para esta sección.`
      });
    }

    next();
  };
};