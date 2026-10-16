INSERT INTO `acceso` (`codigoAcceso`, `nombre`) VALUES
('CON', 'Consultantes'),
('EMP', 'Empleados'),
('ENC', 'Encargadas)');
INSERT INTO `alertaMaterial` (`idAlerta`, `codigoMaterial`, `tipoAlerta`, `estado`, `visto`, `fechaAlerta`, `mensaje`) VALUES
(1, 'CFPE2WHY', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-20 20:34:10', 'El material con código CFPE2WHY tiene stock bajo. Stock actual: 16.00, mínimo requerido: 21.00. Considere realizar un nuevo pedido.'),
(2, 'CJ688TGBU', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 19:44:29', 'El material con código CJ688TGBU tiene stock bajo. Stock actual: 11.00, mínimo requerido: 15.00. Considere realizar un nuevo pedido.'),
(3, 'CJ688TGBL', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 19:46:53', 'El material con código CJ688TGBL tiene stock bajo. Stock actual: 14.00, mínimo requerido: 15.00. Considere realizar un nuevo pedido.'),
(4, 'CFPE1WHY', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 19:51:37', 'El material con código CFPE1WHY tiene stock bajo. Stock actual: 12.00, mínimo requerido: 20.00. Considere realizar un nuevo pedido.'),
(5, '3M-SP33', 'STOCK AGOTADO', 'ACTIVA', 0, '2025-11-21 20:12:57', 'El material con código 3M-SP33 se ha quedado sin stock. Stock actual: 0.00, mínimo requerido: 10.00. Reposición urgente requerida.'),
(6, 'S12-40-C', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:13:33', 'El material con código S12-40-C tiene stock bajo. Stock actual: 8.00, mínimo requerido: 15.00. Considere realizar un nuevo pedido.'),
(7, 'ST-CN3-4', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:16:46', 'El material con código ST-CN3-4 tiene stock bajo. Stock actual: 17.00, mínimo requerido: 20.00. Considere realizar un nuevo pedido.'),
(8, 'ST-CP1-4', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:17:34', 'El material con código ST-CP1-4 tiene stock bajo. Stock actual: 18.00, mínimo requerido: 20.00. Considere realizar un nuevo pedido.'),
(9, 'AOST3-4', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:18:35', 'El material con código AOST3-4 tiene stock bajo. Stock actual: 12.00, mínimo requerido: 20.00. Considere realizar un nuevo pedido.'),
(10, 'AUST1-2', 'STOCK AGOTADO', 'ACTIVA', 0, '2025-11-21 20:19:42', 'El material con código AUST1-2 se ha quedado sin stock. Stock actual: 0.00, mínimo requerido: 20.00. Reposición urgente requerida.'),
(11, 'ANCLOAW34', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:20:37', 'El material con código ANCLOAW34 tiene stock bajo. Stock actual: 5.00, mínimo requerido: 10.00. Considere realizar un nuevo pedido.'),
(12, 'LT-CNR-12', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:22:26', 'El material con código LT-CNR-12 tiene stock bajo. Stock actual: 3.00, mínimo requerido: 10.00. Considere realizar un nuevo pedido.'),
(13, 'LT-CNR-34', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:22:33', 'El material con código LT-CNR-34 tiene stock bajo. Stock actual: 1.00, mínimo requerido: 5.00. Considere realizar un nuevo pedido.'),
(14, 'ST-C2-434', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:23:16', 'El material con código ST-C2-434 tiene stock bajo. Stock actual: 9.00, mínimo requerido: 10.00. Considere realizar un nuevo pedido.'),
(15, 'CJ-PL-2-4', 'STOCK BAJO', 'ACTIVA', 0, '2025-11-21 20:24:18', 'El material con código CJ-PL-2-4 tiene stock bajo. Stock actual: 6.00, mínimo requerido: 20.00. Considere realizar un nuevo pedido.');
INSERT INTO `cliente` (`claveCliente`, `nombreFiscal`, `nombreContacto`, `apellidoPaterno`, `apellidoMaterno`, `email`, `noTelefono`, `direccion`) VALUES
(1, 'Tecnología del pacifico', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'Markwins', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Tecnored de México S.A. de C.V.', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Tamura', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'Amex de México', NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'Semar', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `usuario` (`nombreUsuario`, `password`, `nombre`, `apellidoPaterno`, `apellidoMaterno`, `acceso`) VALUES
('jArellano', '47203635ff9b8e3404170f8cd049f43663ca46843502a9809333aa0555274233', 'Jocelyn', 'Arellano', 'Aramburo', 'ENC'),
('mArellano', 'ff960cb55673958c594d0daaab1e368651c75c02f9687192a1811e7b180336a7', 'Melissa', 'Arellano', 'Calzada', 'ENC');