import { Router } from 'express';
import * as horarioController from '../controllers/horarioController.js';

const router = Router();

// CRUD Básico
router.get('/', horarioController.obtenerTodos);
router.post('/', horarioController.crear);
router.get('/:id', horarioController.obtenerPorId);
router.put('/:id', horarioController.actualizar);
router.delete('/:id', horarioController.eliminar);

// Filtros específicos
router.get('/buscarPorGrado/:gradoId', horarioController.obtenerPorGrado);
router.get('/buscarPorMateria/:materiaId', horarioController.obtenerPorMateria);
router.get('/buscarPorDocente/:docenteId', horarioController.obtenerPorDocente);
router.get('/buscarPorDia/:dia', horarioController.obtenerPorDiaSemana);
router.get('/buscarPorHoraInicio/:hora', horarioController.obtenerPorHoraInicio);
router.get('/buscarPorHoraFin/:hora', horarioController.obtenerPorHoraFin);

export default router;