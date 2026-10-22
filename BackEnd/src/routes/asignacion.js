import { Router } from 'express';
import * as asignacionController from '../controllers/asignacionController.js';

const router = Router();

// CRUD Básico
router.get('/', asignacionController.obtenerTodas);
router.post('/', asignacionController.crear);
router.get('/:id', asignacionController.obtenerPorId);
router.put('/:id', asignacionController.actualizar);
router.delete('/:id', asignacionController.eliminar);

// Búsquedas flexibles por coincidencia parcial de texto
router.get('/buscarPorDocente/:texto', asignacionController.obtenerPorDocente);
router.get('/buscarPorMateria/:materia', asignacionController.obtenerPorMateria);
router.get('/buscarPorGrado/:grado', asignacionController.obtenerPorGrado);
router.get('/docente/:id', asignacionController.obtenerPorDocenteId);

export default router;