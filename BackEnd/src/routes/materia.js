import { Router } from 'express';
import * as materiaController from '../controllers/materiaController.js';

const router = Router();

router.get('/', materiaController.obtenerTodas);
router.get('/buscarPorNombre/:nombre', materiaController.obtenerPorNombre);
router.get('/buscarPorGrado/:gradoId', materiaController.obtenerPorGradoId);
router.get('/buscarPorEstadoPerfil/:estado', materiaController.obtenerPorEstadoPerfil);
router.get('/buscarPorFecha/:fecha', materiaController.obtenerPorFecha);
router.get('/:id', materiaController.obtenerPorId);
router.post('/', materiaController.crear);
router.put('/:id', materiaController.actualizar);
router.delete('/:id', materiaController.eliminar);

export default router;