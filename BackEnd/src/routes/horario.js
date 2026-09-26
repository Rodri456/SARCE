import { Router } from 'express';
import * as horarioController from '../controllers/horarioController.js';

const router = Router();

// Rutas de creación y obtención general
router.get('/', horarioController.obtenerTodos);
router.post('/', horarioController.crear);

// Filtros específicos (Deben ir ANTES de las rutas con /:id para evitar colisiones)
router.get('/buscarPorGrado/:gradoId', horarioController.obtenerPorGrado);
router.get('/buscarPorMateria/:materiaId', horarioController.obtenerPorMateria);
router.get('/buscarPorDocente/:docenteId', horarioController.obtenerPorDocente);
router.get('/buscarPorDia/:dia', horarioController.obtenerPorDiaSemana);
router.get('/buscarPorHoraInicio/:hora', horarioController.obtenerPorHoraInicio);
router.get('/buscarPorHoraFin/:hora', horarioController.obtenerPorHoraFin);

// Endpoints parametrizados por ID
router.get('/:id', horarioController.obtenerPorId);
router.put('/:id', horarioController.actualizar);
router.delete('/:id', horarioController.eliminar);

export default router;