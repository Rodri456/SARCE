import { Router } from 'express';
import * as pagoController from '../controllers/pagoController.js';

const router = Router();

// CRUD Básico
router.get('/', pagoController.obtenerTodos);
router.post('/', pagoController.crear);
router.get('/buscarPorFechas', pagoController.obtenerPorRangoFechas); // Ejemplo: /buscarPorFechas?inicio=2026-01-01&fin=2026-03-30
router.get('/buscarPorMonto', pagoController.obtenerPorRangoMonto);   // Ejemplo: /buscarPorMonto?min=50&max=200
router.get('/:id', pagoController.obtenerPorId);
router.put('/:id', pagoController.actualizar);
router.delete('/:id', pagoController.eliminar);

// Búsquedas flexibles por coincidencias parciales de texto
router.get('/buscarPorEstudiante/:texto', pagoController.obtenerPorEstudiante);
router.get('/buscarPorConcepto/:concepto', pagoController.obtenerPorConcepto);
router.get('/buscarPorEstado/:estado', pagoController.obtenerPorEstado);
router.get('/buscarPorMetodo/:metodo', pagoController.obtenerPorMetodo);
router.get('/buscarPorGrado/:grado', pagoController.obtenerPorGrado);

export default router;