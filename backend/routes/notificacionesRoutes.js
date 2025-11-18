// routes/notificacionesRoutes.js
import express from "express";
import { obtenerNotificaciones } from "../controllers/notificacionesController.js";

const router = express.Router();
router.get("/", obtenerNotificaciones);
export default router;
