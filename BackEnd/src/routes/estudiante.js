import { Router } from 'express';
import * as estudianteController from '../controllers/estudianteController.js';

const router = Router();

router.get('/', estudianteController.obtenerTodos);
router.get('/buscarPorCorreo/:correo', estudianteController.obtenerPorCorreo);
router.get('/buscarPorNombre/:nombre', estudianteController.obtenerPorNombre);
router.get('/buscarPorGrado/:gradoId', estudianteController.obtenerPorGradoId);
router.get('/buscarPorEstadoPerfil/:estado', estudianteController.obtenerPorEstadoPerfil);
router.get('/buscarPorFecha/:fecha', estudianteController.obtenerPorFecha);
router.get('/:id', estudianteController.obtenerPorId);
router.post('/', estudianteController.crear);
router.put('/:id', estudianteController.actualizar);
router.delete('/:id', estudianteController.eliminar);

export default router;