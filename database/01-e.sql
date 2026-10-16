CREATE VIEW vw_ubicacionMateriales AS
SELECT
    u.codigoUbicacion AS codigo,
    u.nombre AS ubicacion,
    c.descripcion AS color
FROM ubicacion AS u
JOIN color AS c ON u.color = c.codigoColor;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_alertaMaterialDetalle`  AS SELECT `a`.`idAlerta` AS `idAlerta`, `a`.`codigoMaterial` AS `codigoMaterial`, `m`.`descripcion` AS `nombreMaterial`, `a`.`tipoAlerta` AS `tipoAlerta`, `a`.`estado` AS `estadoAlerta`, `a`.`visto` AS `visto`, `a`.`fechaAlerta` AS `fechaAlerta`, `a`.`mensaje` AS `mensaje`, `m`.`stockActual` AS `stockActual`, `m`.`stockMinimo` AS `stockMinimo`, `m`.`stockReservado` AS `stockReservado`, round(case when `m`.`stockMinimo` = 0 then 0 else `m`.`stockActual` / `m`.`stockMinimo` * 100 end,2) AS `porcentajeNivel` FROM (`alertaMaterial` `a` join `material` `m` on(`a`.`codigoMaterial` = `m`.`codigoMaterial`)) ORDER BY `a`.`fechaAlerta` DESC ;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_bajoStock`  AS SELECT `m`.`codigoMaterial` AS `codigoMaterial`, `m`.`descripcion` AS `descripcion`, `m`.`stockActual` AS `stockActual`, `m`.`stockMinimo` AS `stockMinimo`, `c`.`nombre` AS `categoria`, `u`.`nombre` AS `ubicacion`, `ma`.`nombre` AS `marca`, `co`.`descripcion` AS `color` FROM ((((`material` `m` left join `categoria` `c` on(`m`.`categoria` = `c`.`claveCategoria`)) left join `ubicacion` `u` on(`m`.`ubicacion` = `u`.`codigoUbicacion`)) left join `marca` `ma` on(`m`.`marca` = `ma`.`claveMarca`)) left join `color` `co` on(`u`.`color` = `co`.`codigoColor`)) WHERE `m`.`stockActual` < `m`.`stockMinimo` ORDER BY `m`.`stockActual` ASC ;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_historialEntradas`  AS SELECT `e`.`noEntrada` AS `entrada`, `e`.`proveedor` AS `proveedor`, `e`.`estado` AS `estado`, `e`.`cliente` AS `cliente`, `e`.`OS` AS `OS`, `e`.`fecha` AS `fecha`, `p`.`nombre` AS `nombreProveedor`, `c`.`nombreFiscal` AS `nombreCliente`, `es`.`nombre` AS `nombreEstado`, `m`.`codigoMaterial` AS `codigoMaterial`, `m`.`descripcion` AS `nombreMaterial`, `m`.`unidadMedida` AS `unidadMedida`, `m`.`color` AS `color`, `em`.`cantidad` AS `cantidad`, `em`.`alerta` AS `alerta` FROM (((((`entrada` `e` join `entradaMaterial` `em` on(`e`.`noEntrada` = `em`.`noEntrada`)) join `material` `m` on(`em`.`codigoMaterial` = `m`.`codigoMaterial`)) left join `proveedor` `p` on(`e`.`proveedor` = `p`.`claveProveedor`)) left join `cliente` `c` on(`e`.`cliente` = `c`.`claveCliente`)) left join `estado` `es` on(`e`.`estado` = `es`.`codigoEstado`)) ORDER BY `e`.`fecha` DESC, `e`.`noEntrada` ASC ;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_historialSalidas`  AS SELECT `s`.`noSalida` AS `salida`, `s`.`estado` AS `estado`, `s`.`cliente` AS `cliente`, `s`.`OS` AS `OS`, `s`.`fecha` AS `fecha`, `c`.`nombreFiscal` AS `nombreCliente`, `es`.`nombre` AS `nombreEstado`, `m`.`codigoMaterial` AS `codigoMaterial`, `m`.`descripcion` AS `nombreMaterial`, `m`.`unidadMedida` AS `unidadMedida`, `m`.`color` AS `color`, `sm`.`cantidad` AS `cantidad`, `sm`.`alerta` AS `alerta` FROM ((((`salida` `s` join `salidaMaterial` `sm` on(`s`.`noSalida` = `sm`.`noSalida`)) join `material` `m` on(`sm`.`codigoMaterial` = `m`.`codigoMaterial`)) left join `cliente` `c` on(`s`.`cliente` = `c`.`claveCliente`)) left join `estado` `es` on(`s`.`estado` = `es`.`codigoEstado`)) ORDER BY `s`.`fecha` DESC, `s`.`noSalida` ASC ;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_materialesAlerta`  AS SELECT `m`.`codigoMaterial` AS `codigoMaterial`, `m`.`descripcion` AS `descripcion`, `m`.`stockActual` AS `stockActual`, `m`.`stockMinimo` AS `stockMinimo`, `c`.`nombre` AS `categoria`, `u`.`nombre` AS `ubicacion`, `ma`.`nombre` AS `marca`, `co`.`descripcion` AS `color`, `m`.`alerta` AS `alerta` FROM ((((`material` `m` left join `categoria` `c` on(`m`.`categoria` = `c`.`claveCategoria`)) left join `ubicacion` `u` on(`m`.`ubicacion` = `u`.`codigoUbicacion`)) left join `marca` `ma` on(`m`.`marca` = `ma`.`claveMarca`)) left join `color` `co` on(`u`.`color` = `co`.`codigoColor`)) WHERE `m`.`alerta` = 1 ORDER BY `m`.`stockActual` ASC ;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_materialesCategorias`  AS SELECT `c`.`claveCategoria` AS `codigo`, `c`.`nombre` AS `categoria` FROM `categoria` AS `c` ;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_historialGlobal` AS 
SELECT
    CONCAT('ENT-', e.noEntrada) AS idReferencia, 
    e.fecha AS fecha, 
    'Entradas' AS modulo, 
    COALESCE(CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', u.apellidoMaterno), e.usuarioSolicita) AS nombreUsuario, 
    CONCAT('Ingreso de ', em.cantidad, ' uds. del material ', m.codigoMaterial) AS accion, 
    CONCAT('Descripción: ', m.descripcion, ' | Estado: ', et.nombre) AS detalle 
FROM entradaMaterial em 
JOIN entrada e ON em.noEntrada = e.noEntrada
JOIN material m ON em.codigoMaterial = m.codigoMaterial
JOIN estado et ON e.estado = et.codigoEstado
LEFT JOIN usuario u ON e.usuarioSolicita = u.nombreUsuario
UNION ALL 
SELECT 
    CONCAT('SAL-', s.noSalida) AS idReferencia, 
    s.fecha AS fecha, 
    'Salidas' AS modulo, 
    COALESCE(CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', u.apellidoMaterno), s.usuarioSolicita) AS nombreUsuario, 
    CONCAT('Retiro de ', sm.cantidad, ' uds. del material ', m.codigoMaterial) AS accion, 
    CONCAT('Descripción: ', m.descripcion, ' | Estado: ', et.nombre) AS detalle 
FROM salidaMaterial sm 
JOIN salida s ON sm.noSalida = s.noSalida
JOIN material m ON sm.codigoMaterial = m.codigoMaterial
JOIN estado et ON s.estado = et.codigoEstado
LEFT JOIN usuario u ON s.usuarioSolicita = u.nombreUsuario
UNION ALL 
SELECT 
    CONCAT('SYS-', ba.idBitacora) AS idReferencia, 
    ba.fecha AS fecha, 
    ba.modulo AS modulo, 
    COALESCE(CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', u.apellidoMaterno), ba.nombreUsuario) AS nombreUsuario, 
    ba.accion AS accion, 
    ba.detalle AS detalle 
FROM bitacora_actividad ba
LEFT JOIN usuario u ON ba.nombreUsuario = u.nombreUsuario
ORDER BY fecha DESC;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_materiales_activos` AS
SELECT 
    codigoMaterial,
    descripcion,
    unidadMedida,
    color,
    stockActual,
    stockMinimo,
    ubicacion,
    stockReservado,
    estado
FROM material WHERE estado = 'ACT';
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_movimientosRecientes` AS 
SELECT 
    `m`.`codigoMaterial` AS `codigoMaterial`, 
    `m`.`descripcion` AS `descripcion`, 
    'Entrada' AS `tipoMovimiento`, 
    `e`.`fecha` AS `fecha`, 
    `em`.`cantidad` AS `cantidad`, 
    `et`.`nombre` AS `estado`, 
    `e`.`noEntrada` AS `folioMovimiento` 
FROM 
    (((`entradaMaterial` `em` 
    JOIN `entrada` `e` ON (`em`.`noEntrada` = `e`.`noEntrada`)) 
    JOIN `material` `m` ON (`em`.`codigoMaterial` = `m`.`codigoMaterial`)) 
    JOIN `estado` `et` ON (`e`.`estado` = `et`.`codigoEstado`)) 
WHERE 
    `e`.`fecha` >= curdate() - interval 7 day 
UNION ALL 
SELECT 
    `m`.`codigoMaterial` AS `codigoMaterial`,
    `m`.`descripcion` AS `descripcion`,
    'Salida' AS `tipoMovimiento`,
    `s`.`fecha` AS `fecha`,
    `sm`.`cantidad` AS `cantidad`,
    `et`.`nombre` AS `estado`,
    `s`.`noSalida` AS `folioMovimiento` 
FROM 
    (((`salidaMaterial` `sm` 
    JOIN `salida` `s` ON (`sm`.`noSalida` = `s`.`noSalida`)) 
    JOIN `material` `m` ON (`sm`.`codigoMaterial` = `m`.`codigoMaterial`)) 
    JOIN `estado` `et` ON (`s`.`estado` = `et`.`codigoEstado`)) 
WHERE 
    `s`.`fecha` >= curdate() - interval 7 day 
ORDER BY 
    `fecha` DESC;
CREATE OR REPLACE VIEW vw_stockActual AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    m.color,
    m.unidadMedida,
    m.stockActual,
    m.stockMinimo,
    m.stockReservado,
    m.observaciones,
    m.estado,
    c.claveCategoria AS codigoCategoria,
    c.nombre AS categoria,
    u.codigoUbicacion,
    u.nombre AS ubicacion,
    u.color AS colorUbicacion,
    ma.claveMarca AS codigoMarca,
    ma.nombre AS marca,
    p.claveProveedor AS codigoProveedor,
    p.nombre AS proveedor
FROM material m
JOIN categoria c ON m.categoria = c.claveCategoria
JOIN ubicacion u ON m.ubicacion = u.codigoUbicacion
LEFT JOIN marca ma ON m.marca = ma.claveMarca
LEFT JOIN proveedor p ON m.proveedor = p.claveProveedor;
DELIMITER $$
CREATE DEFINER=`root`@`localhost` EVENT `evt_verificarAlertasDiarias` ON SCHEDULE EVERY 1 DAY STARTS '2025-11-19 14:42:00' ON COMPLETION NOT PRESERVE ENABLE DO CALL sp_actualizarAlertasStock()$$
DELIMITER ;
COMMIT;