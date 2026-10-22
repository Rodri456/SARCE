import { Router } from 'express';
import * as pagoController from '../controllers/pagoController.js';

const router = Router();

// CRUD Básico
router.get('/', pagoController.obtenerTodos);
router.post('/', pagoController.crear);
router.get('/buscarPorFechas', pagoController.obtenerPorRangoFechas);
router.get('/buscarPorMonto', pagoController.obtenerPorRangoMonto);
router.get('/:id', pagoController.obtenerPorId);
router.put('/:id', pagoController.actualizar);
router.delete('/:id', pagoController.eliminar);

// Búsquedas específicas
router.get('/buscarPorEstudiante/:texto', pagoController.obtenerPorEstudiante);
router.get('/buscarPorConcepto/:concepto', pagoController.obtenerPorConcepto);
router.get('/buscarPorEstado/:estado', pagoController.obtenerPorEstado);
router.get('/buscarPorGrado/:grado', pagoController.obtenerPorGrado);
router.get('/estudiante/:id', pagoController.obtenerPorEstudianteId);

export default router;