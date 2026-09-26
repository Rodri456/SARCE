import { Router } from 'express';
import * as eventoController from '../controllers/eventoCalendarioController.js';

const router = Router();

// Rutas generales y de creación
router.get('/', eventoController.obtenerTodos);
router.post('/', eventoController.crear);

// Rutas con endpoints específicos (deben definirse ANTES de /:id)
router.get('/buscarPorFechas', eventoController.obtenerPorRangoFechas);
router.get('/buscarPorTexto/:texto', eventoController.obtenerPorTexto);
router.get('/buscarPorTipo/:tipo', eventoController.obtenerPorTipo);
router.get('/buscarPorLugar/:lugar', eventoController.obtenerPorLugar);
router.get('/buscarPorCreador/:creador', eventoController.obtenerPorCreador);
router.get('/buscarPorGrado/:grado', eventoController.obtenerPorGrado);

// Rutas parametrizadas dinámicas genéricas
router.get('/:id', eventoController.obtenerPorId);
router.put('/:id', eventoController.actualizar);
router.delete('/:id', eventoController.eliminar);

export default router;