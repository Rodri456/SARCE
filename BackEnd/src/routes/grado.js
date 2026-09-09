import { Router } from 'express';
import * as gradosController from '../controllers/gradosController.js';

const router = Router();

router.get('/', gradosController.obtenerTodos);
router.get('/buscarPorNombre/:nombre', gradosController.obtenerPorNombre);
router.get('/:id', gradosController.obtenerPorId);
router.post('/', gradosController.crear);
router.put('/:id', gradosController.actualizar);
router.delete('/:id', gradosController.eliminar);

export default router;