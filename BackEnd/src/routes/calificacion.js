import { Router } from 'express';
import * as calificacionController from '../controllers/calificacionController.js';

const router = Router();

router.get('/', calificacionController.obtenerTodas);
router.post('/', calificacionController.crear);
router.get('/buscarPorNota', calificacionController.obtenerPorNota); // Uso: /buscarPorNota?min=7&max=10
router.get('/:id', calificacionController.obtenerPorId);
router.put('/:id', calificacionController.actualizar);
router.delete('/:id', calificacionController.eliminar);

router.get('/buscarPorEstudiante/:texto', calificacionController.obtenerPorEstudiante);
router.get('/buscarPorDocente/:texto', calificacionController.obtenerPorDocente);
router.get('/buscarPorMateria/:materia', calificacionController.obtenerPorMateria);
router.get('/buscarPorGrado/:grado', calificacionController.obtenerPorGrado);
router.get('/buscarPorPeriodo/:periodo', calificacionController.obtenerPorPeriodo);

export default router;