import { Router } from 'express';
import * as usuariosController from '../controllers/usuariosController.js';

const router = Router();

router.get('/', usuariosController.obtenerTodos);
router.get('/buscarPorCorreo/:correo', usuariosController.obtenerPorCorreo);
router.get('/buscarPorNombre/:nombre', usuariosController.obtenerPorNombre);
router.get('/buscarPorRol/:rol', usuariosController.obtenerPorRol);
router.post('/', usuariosController.crear);
router.put('/:id', usuariosController.actualizar);
router.delete('/:id', usuariosController.eliminar);

export default router;