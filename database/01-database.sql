USE almacenNetcommtel;
CREATE TABLE color (
    codigoColor CHAR(3) PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(60) NULL
);
CREATE TABLE proveedor (
    claveProveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(25) NOT NULL,
    direccion VARCHAR(90),
    noTelefono VARCHAR(20),
    email VARCHAR(60)
);
CREATE TABLE acceso (
    codigoAcceso CHAR(3) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);
CREATE TABLE categoria (
    claveCategoria CHAR(3) PRIMARY KEY,
    nombre VARCHAR(25) NOT NULL,
    descripcion VARCHAR(100)
);
CREATE TABLE cliente (
    claveCliente INT AUTO_INCREMENT PRIMARY KEY,
    nombreFiscal VARCHAR(60) NOT NULL,
    nombreContacto VARCHAR(60),
    apellidoPaterno VARCHAR(30),
    apellidoMaterno VARCHAR(30),
    email VARCHAR(80),
    noTelefono VARCHAR(20),
    direccion VARCHAR(150)
);
CREATE TABLE estado (
    codigoEstado CHAR(3) PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(60)
);
CREATE TABLE marca (
    claveMarca INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(200)
);
CREATE TABLE ubicacion (
    codigoUbicacion CHAR(5) PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(100) NOT NULL,
    color CHAR(3),
    FOREIGN KEY (color) REFERENCES color(codigoColor)
);
CREATE TABLE usuario (
    nombreUsuario VARCHAR(15) PRIMARY KEY UNIQUE,
    password CHAR(64) NOT NULL,
    nombre VARCHAR(25) NOT NULL,
    apellidoPaterno VARCHAR(15) NOT NULL,
    apellidoMaterno VARCHAR(15) NOT NULL,
    acceso CHAR(3) NOT NULL,
    FOREIGN KEY (acceso) REFERENCES acceso(codigoAcceso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
CREATE TABLE bitacora_actividad (
    idBitacora INT AUTO_INCREMENT PRIMARY KEY,
    nombreUsuario VARCHAR(15) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    detalle TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nombreUsuario) REFERENCES usuario(nombreUsuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
CREATE TABLE material (
    codigoMaterial VARCHAR(28) PRIMARY KEY,
    descripcion VARCHAR(150) NOT NULL,
    color VARCHAR(25) NOT NULL,
    observaciones VARCHAR(150),
    unidadMedida VARCHAR(15) NOT NULL,
    stockActual DECIMAL(10,2) DEFAULT 0 CHECK (stockActual >= 0),
    stockMinimo DECIMAL(10,2) DEFAULT 0 CHECK (stockMinimo >= 0),
    stockReservado DECIMAL(10,2) DEFAULT 0 CHECK (stockReservado >= 0),
    alerta BOOLEAN NOT NULL DEFAULT FALSE,
    imagen VARCHAR(100),
    codigoInterno BOOLEAN NOT NULL DEFAULT TRUE,
    categoria CHAR(3) NOT NULL,
    ubicacion CHAR(5) NOT NULL,
    marca INT,
    estado CHAR(3),
    proveedor INT,
    FOREIGN KEY (categoria) REFERENCES categoria(claveCategoria)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (ubicacion) REFERENCES ubicacion(codigoUbicacion)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (marca) REFERENCES marca(claveMarca)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (proveedor) REFERENCES proveedor(claveProveedor)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (estado) REFERENCES estado(codigoEstado)
        ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE TABLE alertaMaterial (
    idAlerta INT AUTO_INCREMENT PRIMARY KEY,
    codigoMaterial VARCHAR(28),
    tipoAlerta VARCHAR(50),
    estado VARCHAR(10) DEFAULT 'ACTIVA',
    visto BOOLEAN DEFAULT FALSE,
    fechaAlerta DATETIME DEFAULT NOW(),
    mensaje VARCHAR(255),
    FOREIGN KEY (codigoMaterial) REFERENCES material(codigoMaterial)
        ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE TABLE salida (
    noSalida INT PRIMARY KEY AUTO_INCREMENT,
    OS VARCHAR(50),
    fecha DATE NOT NULL,
    cotizacion VARCHAR(20),
    cliente INT NOT NULL,
    estado CHAR(3) NOT NULL,
    usuarioSolicita VARCHAR(15) NOT NULL,
    usuarioAprueba VARCHAR(15) NULL,
    fechaAprobacion DATETIME NULL,
    FOREIGN KEY (cliente) REFERENCES cliente(claveCliente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (estado) REFERENCES estado(codigoEstado)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (usuarioSolicita) REFERENCES usuario(nombreUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (usuarioAprueba) REFERENCES usuario(nombreUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE TABLE salidaMaterial (
    codigoMaterial VARCHAR(28),
    noSalida INT,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    observaciones VARCHAR(150),
    alerta BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (codigoMaterial, noSalida),
    FOREIGN KEY (codigoMaterial) REFERENCES material(codigoMaterial)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (noSalida) REFERENCES salida(noSalida)
        ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE TABLE entrada (
    noEntrada INT PRIMARY KEY AUTO_INCREMENT,
    OS VARCHAR(25),
    fecha DATE NOT NULL,
    proveedor INT NOT NULL,
    estado CHAR(3) NOT NULL,
    cliente INT,
    usuarioSolicita VARCHAR(15) NOT NULL,
    usuarioAprueba VARCHAR(15) NULL,
    fechaAprobacion DATETIME NULL,
    FOREIGN KEY (proveedor) REFERENCES proveedor(claveProveedor)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (estado) REFERENCES estado(codigoEstado)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (cliente) REFERENCES cliente(claveCliente)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (usuarioSolicita) REFERENCES usuario(nombreUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (usuarioAprueba) REFERENCES usuario(nombreUsuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE TABLE entradaMaterial (
    codigoMaterial VARCHAR(28),
    noEntrada INT,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    observaciones VARCHAR(150),
    alerta BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (codigoMaterial, noEntrada),
    FOREIGN KEY (codigoMaterial) REFERENCES material(codigoMaterial)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (noEntrada) REFERENCES entrada(noEntrada)
        ON UPDATE CASCADE ON DELETE CASCADE
);
INSERT INTO `categoria` (`claveCategoria`, `nombre`, `descripcion`) VALUES
('AUD', 'Audio y Video', 'Materiales relacionados con sistemas de audio y video'),
('CAB', 'Cableado', 'Cables eléctricos y de red en distintas presentaciones'),
('CCB', 'Caja de cable', 'Cajas de cableado estructurado o de red'),
('CCT', 'CCTV', 'Equipos y materiales para sistemas de circuito cerrado de TV'),
('CON', 'Conectores', 'Conectores de diferentes tipos para instalaciones'),
('DIV', 'Material diverso', 'Material variado de uso general en el almacén'),
('FIB', 'Fibra óptica', 'Material y accesorios de fibra óptica'),
('FPL', 'Faceplates', 'Placas de conexión para instalaciones'),
('PAT', 'Patchcords', 'Cables de conexión tipo patchcord'),
('TEL', 'Telefonía', 'Material y accesorios relacionados con telefonía'),
('TOR', 'Gabinete de tornillería', 'Gabinetes, tornillos y accesorios de fijación'),
('TUB', 'Tubería', 'Tuberías y accesorios relacionados');
INSERT INTO `color` (`codigoColor`, `nombre`, `descripcion`) VALUES
('AMA', 'Amarillo', '#feff53'),
('AZC', 'Azul claro', '#49c4e9'),
('BEI', 'Beige', '#ffedba'),
('BLA', 'Blanco', '#ffffff'),
('GRI', 'Gris', '#d9d9d9'),
('MOR', 'Morado', '#7449ff'),
('NAR', 'Naranja', '#ff9900'),
('ROS', 'Rosa', '#ff57d6'),
('VCL', 'Verde claro', '#aafa7d'),
('VJU', 'Verde jungla', '#24a7a1');
INSERT INTO `ubicacion` (`codigoUbicacion`, `nombre`, `descripcion`, `color`) VALUES
('CAB', 'Cabecera', '', 'AZC'),
('ES1', 'Estante 1', 'El Estante 1 iniciando a contar desde arriba', 'BEI'),
('ES2', 'Estante 2', 'El Estante 2 iniciando a contar desde arriba', 'BEI'),
('ES3', 'Estante 3', 'El Estante 3 iniciando a contar desde arriba', 'BEI'),
('GT-A1', 'G Tornilleria A1', 'El Gabinete de tornilleria, primera columna, primer nivel', 'BLA'),
('GT-A2', 'G Tornilleria A2', 'El Gabinete de tornilleria, primera columna, segundo nivel', 'BLA'),
('GT-A3', 'G Tornilleria A3', 'El Gabinete de tornilleria, primera columna, tercer nivel', 'BLA'),
('GT-A4', 'G Tornilleria A4', 'El Gabinete de tornilleria, primera columna, cuarto nivel', 'BLA'),
('GT-A5', 'G Tornilleria A5', 'El Gabinete de tornilleria, primera columna, quinto nivel', 'BLA'),
('GT-A6', 'G Tornilleria A6', 'El Gabinete de tornilleria, primera columna, sexto nivel', 'BLA'),
('GT-A7', 'G Tornilleria A7', 'El Gabinete de tornilleria, primera columna, septimo nivel', 'BLA'),
('GT-A8', 'G Tornilleria A8', 'El Gabinete de tornilleria, primera columna, octavo nivel', 'BLA'),
('GT-B1', 'G Tornilleria B1', 'El Gabinete de tornilleria, segunda columna, primer nivel', 'BLA'),
('GT-B2', 'G Tornilleria B2', 'El Gabinete de tornilleria, segunda columna, segundo nivel', 'BLA'),
('GT-B3', 'G Tornilleria B3', 'El Gabinete de tornilleria, segunda columna, tercer nivel', 'BLA'),
('GT-B4', 'G Tornilleria B4', 'El Gabinete de tornilleria, segunda columna, cuarto nivel', 'BLA'),
('GT-B5', 'G Tornilleria B5', 'El Gabinete de tornilleria, segunda columna, quinto nivel', 'BLA'),
('GT-B6', 'G Tornilleria B6', 'El Gabinete de tornilleria, segunda columna, sexto nivel', 'BLA'),
('GT-B7', 'G Tornilleria B7', 'El Gabinete de tornilleria, segunda columna, septimo nivel', 'BLA'),
('GT-B8', 'G Tornilleria B8', 'El Gabinete de tornilleria, segunda columna, octavo nivel', 'BLA'),
('GT-C1', 'G Tornilleria C1', 'El Gabinete de tornilleria, tercer columna, primer nivel', 'BLA'),
('GT-C2', 'G Tornilleria C2', 'El Gabinete de tornilleria, tercer columna, segundo nivel', 'BLA'),
('GT-C3', 'G Tornilleria C3', 'El Gabinete de tornilleria, tercer columna, tercer nivel', 'BLA'),
('GT-C4', 'G Tornilleria C4', 'El Gabinete de tornilleria, tercer columna, cuarto nivel', 'BLA'),
('GT-C5', 'G Tornilleria C5', 'El Gabinete de tornilleria, tercer columna, quinto nivel', 'BLA'),
('GT-C6', 'G Tornilleria C6', 'El Gabinete de tornilleria, tercer columna, sexto nivel', 'BLA'),
('GT-C7', 'G Tornilleria C7', 'El Gabinete de tornilleria, tercer columna, septimo nivel', 'BLA'),
('GT-C8', 'G Tornilleria C8', 'El Gabinete de tornilleria, tercer columna, octavo nivel', 'BLA'),
('OF-CM', 'Oficina Comercial', '', 'NAR'),
('PSO', 'Piso', 'El piso del almacén', 'GRI'),
('RA.1', 'Rack A 1', 'El Rack A, primer nivel iniciando a contar desde arriba', 'VCL'),
('RA.2', 'Rack A 2', 'El Rack A, segundo nivel iniciando a contar desde arriba', 'VCL'),
('RA.3', 'Rack A 3', 'El Rack A, tercer nivel iniciando a contar desde arriba', 'VCL'),
('RA.4', 'Rack A 4', 'El Rack A, cuarto nivel iniciando a contar desde arriba', 'VCL'),
('RA.5', 'Rack A 5', 'El Rack A, quinto nivel iniciando a contar desde arriba', 'VCL'),
('RB.1', 'Rack B 1', 'El Rack B, primer nivel iniciando a contar desde arriba', 'AZC'),
('RB.2', 'Rack B 2', 'El Rack B, segundo nivel iniciando a contar desde arriba', 'AZC'),
('RB.3', 'Rack B 3', 'El Rack B, tercer nivel iniciando a contar desde arriba', 'AZC'),
('RB.4', 'Rack B 4', 'El Rack B, cuarto nivel iniciando a contar desde arriba', 'AZC'),
('RB.5', 'Rack B 5', 'El Rack B, quinto nivel iniciando a contar desde arriba', 'AZC'),
('RC.1', 'Rack C 1', 'El Rack C, primer nivel iniciando a contar desde arriba', 'MOR'),
('RC.2', 'Rack C 2', 'El Rack C, segundo nivel iniciando a contar desde arriba', 'MOR'),
('RC.3', 'Rack C 3', 'El Rack C, tercer nivel iniciando a contar desde arriba', 'MOR'),
('RC.4', 'Rack C 4', 'El Rack C, cuarto nivel iniciando a contar desde arriba', 'MOR'),
('RC.5', 'Rack C 5', 'El Rack C, quinto nivel iniciando a contar desde arriba', 'MOR'),
('RCV', 'Rack Vertical', 'Rack vertical colgado al lado de la puerta cuando esta está ', 'VJU'),
('RD.1', 'Rack D 1', 'El Rack D, primer nivel iniciando a contar desde arriba', 'AMA'),
('RD.2', 'Rack D 2', 'El Rack D, segundo nivel iniciando a contar desde arriba', 'AMA'),
('RD.3', 'Rack D 3', 'El Rack D, tercer nivel iniciando a contar desde arriba', 'AMA'),
('RD.4', 'Rack D 4', 'El Rack D, cuarto nivel iniciando a contar desde arriba', 'AMA'),
('RD.5', 'Rack D 5', 'El Rack D, quinto nivel iniciando a contar desde arriba', 'AMA'),
('RE.1', 'Rack E 1', 'El Rack E, primer nivel iniciando a contar desde arriba', 'ROS'),
('RE.2', 'Rack E 2', 'El Rack E, segundo nivel iniciando a contar desde arriba', 'ROS'),
('RE.3', 'Rack E 3', 'El Rack E, tercer nivel iniciando a contar desde arriba', 'ROS'),
('RE.4', 'Rack E 4', 'El Rack E, cuarto nivel iniciando a contar desde arriba', 'ROS'),
('RE.5', 'Rack E 5', 'El Rack E, quinto nivel iniciando a contar desde arriba', 'ROS');
INSERT INTO `marca` (`claveMarca`, `nombre`, `descripcion`) VALUES
(1, 'NETCOMMTEL', ''),
(2, 'PILOT', ''),
(3, 'WEIFENG', ''),
(4, 'TOSHIBA', ''),
(5, 'VELTECK', ''),
(6, 'DEXON', ''),
(7, 'POWER-PAK', ''),
(8, 'NTC', ''),
(9, 'LOGITECH', ''),
(10, 'MICROTEST', ''),
(11, 'PANDUIT', ''),
(12, 'PRECISION', ''),
(13, 'HP', ''),
(14, 'DELL', ''),
(15, 'EMACHINES', ''),
(16, 'VKAREN', ''),
(17, 'MTG', ''),
(18, 'VEKER', ''),
(19, 'GLOBAL', ''),
(20, 'STEREN', ''),
(21, 'ACCESS PRO', ''),
(22, 'CISCO', ''),
(23, 'TCINTERNATIONAL', ''),
(24, 'LINKEDPRO', ''),
(25, 'PLANTRONICS', ''),
(26, 'POLY', ''),
(27, 'NOPRICE', ''),
(28, 'HESLE OUTFITTERS', ''),
(29, '3M', ''),
(30, 'GLOBOS PAYASO', ''),
(31, 'SALVER', ''),
(32, 'CANPLAST', ''),
(33, 'TP-LINK', ''),
(34, 'TRUPER', ''),
(35, 'TAPE', ''),
(36, 'BYP', ''),
(37, 'GILDAN', ''),
(38, 'HARRITON', ''),
(39, 'JUSTHOODS', ''),
(40, 'CORE365', ''),
(41, 'POLO', ''),
(42, 'DEVON&JONES', ''),
(43, 'EPCOM', ''),
(44, 'ROSSLARE', ''),
(45, 'SAXXON', ''),
(46, 'CMR', ''),
(47, 'POLYPHASER', ''),
(48, 'UBIQUIT', ''),
(49, 'CORNING', ''),
(50, 'BELDENT', ''),
(51, 'MONO', ''),
(52, 'MONOPRICE', ''),
(53, 'BELDEN', ''),
(54, 'PANGNGAL', ''),
(55, 'LEVITON', ''),
(56, 'NORTEL', ''),
(57, 'NORTH SYS', ''),
(58, 'SAMSUNG', ''),
(59, 'ICC', ''),
(60, 'WI-TEK', ''),
(61, 'HIKVISION', ''),
(62, 'STI', ''),
(63, 'SKHYNIX', ''),
(64, 'LINKSYS', ''),
(65, 'LITE-ON IT CORP', ''),
(66, 'LOGO', ''),
(67, 'HILOOK', ''),
(68, 'PROVISION ISR', ''),
(69, 'VR CAM', ''),
(70, 'AXIS', ''),
(71, 'UNI-T', ''),
(72, 'JABRA GN', ''),
(73, 'WESTERN', ''),
(74, 'FOSET', ''),
(75, 'SHEPHERD', ''),
(76, 'RAWLET', ''),
(77, 'SCHNEIDER ELECTRIC', ''),
(78, 'THORSMAN', ''),
(79, 'DISMA', ''),
(80, 'BELL OUTDOOR', ''),
(81, 'BOLTECK', ''),
(82, 'HALEX', ''),
(83, 'FIERO', ''),
(84, 'SUNBEAM', ''),
(85, 'PET EXPRESS', ''),
(86, 'GRUPO CN', ''),
(87, 'INDIANA', ''),
(88, 'SFIRE', ''),
(89, 'CONDUMEX', ''),
(90, 'SIEMENS', ''),
(91, 'VALCOM', ''),
(92, 'SIEMON', ''),
(93, 'BLACK BOX', ''),
(94, 'AMD NETCONNET', ''),
(95, 'VOLTECK', NULL),
(96, 'Sin Registro', NULL),
(97, 'ADTEK', NULL),
(98, 'WAM', NULL),
(99, 'GOSPELL', NULL);
INSERT INTO `estado` (`codigoEstado`, `nombre`, `descripcion`) VALUES
('ACT', 'Activo', 'Elemento disponible y visible en el sistema'),
('INT', 'Inactivo', 'Elemento dado de baja (no se borra por historial)'),
('PEN', 'Pendiente', 'Solicitud creada por Empleado (EMP), esperando autorización'),
('APR', 'Aprobado', 'Autorizado por Encargada (ENC) - El stock ha sido afectado'),
('REC', 'Rechazado', 'Denegado por Encargada (ENC) - El stock no sufre cambios'),
('CAN', 'Cancelado', 'Anulado por el mismo creador antes de ser revisado');
INSERT INTO `proveedor` (`claveProveedor`, `nombre`, `direccion`, `noTelefono`, `email`) VALUES
(1, 'Sin Registro', '', '', ''),
(2, 'DICE ', '', '', ''),
(3, 'SYSCOM', '', '', ''),
(4, 'USA', '', '', ''),
(5, 'STEREN', '', '', ''),
(6, 'TVC', '', '', ''),
(7, 'PORTENNTUM', '', '', ''),
(8, 'CT', '', '', ''),
(9, 'SENSA', '', '', ''),
(10, 'PHILLIPS', '', '', ''),
(11, 'PETSA', '', '', ''),
(12, 'NTC', '', '', ''),
(13, 'CHINO', '', '', ''),
(14, 'NORTH SYSTEM', '', '', ''),
(15, 'AMAZON', '', '', ''),
(16, 'HOME DEPOT', '', '', ''),
(17, 'TRUPER', '', '', ''),
(18, 'ELSA', '', '', '');