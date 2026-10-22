import { Router } from 'express';
import * as eventoController from '../controllers/eventoCalendarioController.js';

const router = Router();

router.get('/', eventoController.obtenerTodos);
router.post('/', eventoController.crear);

// Específicas: SIEMPRE antes de /:id
router.get('/buscarPorFechas', eventoController.obtenerPorRangoFechas);
router.get('/buscarPorTexto/:texto', eventoController.obtenerPorTexto);
router.get('/buscarPorTipo/:tipo', eventoController.obtenerPorTipo);

router.get('/:id', eventoController.obtenerPorId);
router.put('/:id', eventoController.actualizar);
router.delete('/:id', eventoController.eliminar);

export default router;