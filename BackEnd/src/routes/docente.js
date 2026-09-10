import { Router } from 'express';
import * as docenteController from '../controllers/docenteController.js';

const router = Router();

router.get('/', docenteController.obtenerTodos);
router.get('/buscarPorCorreo/:correo', docenteController.obtenerPorCorreo);
router.get('/buscarPorNombre/:nombre', docenteController.obtenerPorNombre);
router.get('/buscarPorFecha/:fecha', docenteController.obtenerPorFecha);
router.get('/:id', docenteController.obtenerPorId);
router.post('/', docenteController.crear);
router.put('/:id', docenteController.actualizar);
router.delete('/:id', docenteController.eliminar);

export default router;