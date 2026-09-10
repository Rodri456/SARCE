import { Router } from 'express';
import * as eventoController from '../controllers/eventoCalendarioController.js';

const router = Router();

router.get('/', eventoController.obtenerTodos);
router.post('/', eventoController.crear);
router.get('/buscarPorFechas', eventoController.obtenerPorRangoFechas); // Ejemplo: /buscarPorFechas?inicio=2026-03-01&fin=2026-03-31
router.get('/:id', eventoController.obtenerPorId);
router.put('/:id', eventoController.actualizar);
router.delete('/:id', eventoController.eliminar);

router.get('/buscarPorTexto/:texto', eventoController.obtenerPorTexto);
router.get('/buscarPorTipo/:tipo', eventoController.obtenerPorTipo);
router.get('/buscarPorLugar/:lugar', eventoController.obtenerPorLugar);
router.get('/buscarPorCreador/:creador', eventoController.obtenerPorCreador);
router.get('/buscarPorGrado/:grado', eventoController.obtenerPorGrado);

export default router;