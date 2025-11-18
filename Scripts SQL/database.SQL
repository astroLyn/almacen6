-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
DROP DATABASE almacenNetcommtelPruebas;
CREATE DATABASE almacenNetcommtelPruebas;
USE almacenNetcommtelPruebas;
--Tablas sin llaves fóraneas
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
--Tablas con llaves fóraneas
CREATE TABLE ubicacion (
    codigoUbicacion CHAR(5) PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(60) NOT NULL,
    color CHAR(3),
    FOREIGN KEY (color) REFERENCES color(codigoColor)
);
DROP TABLE IF EXISTS usuario;

CREATE TABLE usuario (
    nombreUsuario VARCHAR(15) PRIMARY KEY UNIQUE,
    password CHAR(64) NOT NULL, -- HASH SHA256 (usa 64, no 60)
    nombre VARCHAR(25) NOT NULL,
    apellidoPaterno VARCHAR(15) NOT NULL,
    apellidoMaterno VARCHAR(15) NOT NULL,
    acceso CHAR(3) NOT NULL,
    FOREIGN KEY (acceso) REFERENCES acceso(codigoAcceso)
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
    stockReservado DECIMAL(10,2) DEFAULT 0 CHECK (stockReservado >= 0),
    stockMinimo DECIMAL(10,2) DEFAULT 0 CHECK (stockMinimo >= 0),
    alerta BOOLEAN NOT NULL DEFAULT FALSE,
    imagen VARCHAR(100),
    codigoInterno BOOLEAN NOT NULL DEFAULT TRUE,
    categoria CHAR(3) NOT NULL,
    ubicacion CHAR(5) NOT NULL,
    marca INT,
    estado CHAR(3),
    proveedor INT,
    FOREIGN KEY (categoria) REFERENCES categoria(claveCategoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (ubicacion) REFERENCES ubicacion(codigoUbicacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (marca) REFERENCES marca(claveMarca)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (proveedor) REFERENCES proveedor(claveProveedor)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (estado) REFERENCES estado(codigoEstado)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);
ALTER TABLE material
    MODIFY stockActual DECIMAL(10,2) DEFAULT 0,
    MODIFY stockReservado DECIMAL(10,2) DEFAULT 0;

CREATE TABLE materialApartado (
    noApartado INT PRIMARY KEY AUTO_INCREMENT,
    OS VARCHAR(50),
    fecha DATE NOT NULL,
    cotizacion VARCHAR(25),
    cliente INT NOT NULL,
    estado CHAR(3) NOT NULL,
    FOREIGN KEY (cliente) REFERENCES cliente(claveCliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (estado) REFERENCES estado(codigoEstado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
ALTER TABLE materialApartado 
ADD COLUMN darSalida BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE apartadoMaterial (
    codigoMaterial VARCHAR(28),
    noApartado INT,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    observaciones VARCHAR(150),
    alerta BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (codigoMaterial, noApartado),
    FOREIGN KEY (codigoMaterial) REFERENCES material(codigoMaterial)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (noApartado) REFERENCES materialApartado(noApartado)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TABLE salida (
    noSalida INT PRIMARY KEY AUTO_INCREMENT,
    OS VARCHAR(50),
    fecha DATE NOT NULL,
    cotizacion VARCHAR(20),
    materialApartado INT,
    cliente INT NOT NULL,
    estado CHAR(3) NOT NULL,
    FOREIGN KEY (materialApartado) REFERENCES materialApartado(noApartado)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (cliente) REFERENCES cliente(claveCliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (estado) REFERENCES estado(codigoEstado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
CREATE TABLE salidaMaterial (
    codigoMaterial VARCHAR(28),
    noSalida INT,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    observaciones VARCHAR(150),
    alerta BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (codigoMaterial, noSalida),
    FOREIGN KEY (codigoMaterial) REFERENCES material(codigoMaterial)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (noSalida) REFERENCES salida(noSalida)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TABLE entrada (
    noEntrada INT PRIMARY KEY AUTO_INCREMENT,
    OS VARCHAR(25),
    fecha DATE NOT NULL,
    proveedor INT NOT NULL,
    estado CHAR(3) NOT NULL,
    cliente INT,
    FOREIGN KEY (proveedor) REFERENCES proveedor(claveProveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (estado) REFERENCES estado(codigoEstado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (cliente) REFERENCES cliente(claveCliente)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);
CREATE TABLE entradaMaterial (
    codigoMaterial VARCHAR(28),
    noEntrada INT,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    observaciones VARCHAR(150),
    alerta BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (codigoMaterial, noEntrada),
    FOREIGN KEY (codigoMaterial) REFERENCES material(codigoMaterial)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (noEntrada) REFERENCES entrada(noEntrada)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE TABLE alertaMaterial (
    idAlerta INT AUTO_INCREMENT PRIMARY KEY,
    codigoMaterial VARCHAR(28),
    fechaAlerta DATETIME DEFAULT NOW(),
    mensaje VARCHAR(255)
);
ALTER TABLE alertaMaterial
ADD COLUMN tipoAlerta VARCHAR(50) AFTER codigoMaterial,
ADD COLUMN estado VARCHAR(10) DEFAULT 'ACTIVA' AFTER tipoAlerta,
ADD COLUMN visto BOOLEAN DEFAULT FALSE AFTER estado;