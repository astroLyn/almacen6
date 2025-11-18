--Tabla: material
CREATE INDEX idx_material_estado ON material (estado);
CREATE INDEX idx_material_categoria ON material (categoria);
CREATE INDEX idx_material_ubicacion ON material (ubicacion);
CREATE INDEX idx_material_marca ON material (marca);
CREATE INDEX idx_material_stockActual_stockMinimo ON material (stockActual, stockMinimo);
-- Tabla: entrada
CREATE INDEX idx_entrada_fecha_estado ON entrada (fecha, estado);
CREATE INDEX idx_entrada_proveedor ON entrada (proveedor);
CREATE INDEX idx_entrada_cliente ON entrada (cliente);
-- Tabla: entradaMaterial
CREATE INDEX idx_entradaMaterial_noEntrada ON entradaMaterial (noEntrada);
CREATE INDEX idx_entradaMaterial_codigoMaterial ON entradaMaterial (codigoMaterial);
-- Tabla: salida
CREATE INDEX idx_salida_fecha_estado ON salida (fecha, estado);
CREATE INDEX idx_salida_cliente ON salida (cliente);
-- Tabla: salidaMaterial
CREATE INDEX idx_salidaMaterial_noSalida ON salidaMaterial (noSalida);
CREATE INDEX idx_salidaMaterial_codigoMaterial ON salidaMaterial (codigoMaterial);
-- Tabla: materialApartado
CREATE INDEX idx_materialApartado_fecha_estado ON materialApartado (fecha, estado);
CREATE INDEX idx_materialApartado_cliente ON materialApartado (cliente);
-- Tabla: apartadoMaterial
CREATE INDEX idx_apartadoMaterial_noApartado ON apartadoMaterial (noApartado);
CREATE INDEX idx_apartadoMaterial_codigoMaterial ON apartadoMaterial (codigoMaterial);
-- Tabla: estado
CREATE UNIQUE INDEX idx_estado_codigo ON estado (codigoEstado);
-- Tabla: cliente
CREATE INDEX idx_cliente_nombre ON cliente (nombreFiscal);