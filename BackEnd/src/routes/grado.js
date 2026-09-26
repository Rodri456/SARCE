import { Router } from 'express';
import * as gradosController from '../controllers/gradosController.js';

const router = Router();

// Endpoint raíz
router.get('/', gradosController.obtenerTodos);
router.post('/', gradosController.crear);

// Busqueda por nombre (antes de /:id para prevenir conflictos de mapeo)
router.get('/buscarPorNombre/:nombre', gradosController.obtenerPorNombre);

// Endpoints dinámicos por ID
router.get('/:id', gradosController.obtenerPorId);
router.put('/:id', gradosController.actualizar);
router.delete('/:id', gradosController.eliminar);

export default router;