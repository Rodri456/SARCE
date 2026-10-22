import * as eventoService from '../services/eventoCalendarioServices.js';

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const fechaValida = (f) => {
    if (typeof f !== 'string' || !FECHA_REGEX.test(f)) return false;
    const d = new Date(`${f}T00:00:00Z`);
    return !isNaN(d) && d.toISOString().slice(0, 10) === f;
};

const idValido = (id) => /^\d+$/.test(id);

// Devuelve un mensaje de error o null si todo está bien
const validarEvento = ({ nombre, tipo, fechaInicio, fechaFin }) => {
    if (!nombre || !tipo || !fechaInicio || !fechaFin) {
        return 'Campos requeridos: nombre, tipo, fechaInicio, fechaFin';
    }
    if (typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 150) {
        return 'nombre debe ser texto de 1 a 150 caracteres';
    }
    if (typeof tipo !== 'string' || tipo.trim().length === 0 || tipo.length > 50) {
        return 'tipo debe ser texto de 1 a 50 caracteres';
    }
    if (!fechaValida(fechaInicio) || !fechaValida(fechaFin)) {
        return 'fechaInicio y fechaFin deben tener formato YYYY-MM-DD';
    }
    if (fechaFin < fechaInicio) {
        return 'fechaFin no puede ser menor que fechaInicio';
    }
    return null;
};

const manejarError = (err, res, next) => {
    if (err.code === '23514') {
        return res.status(400).json({ message: 'fechaFin no puede ser menor que fechaInicio' });
    }
    next(err);
};

export const obtenerTodos = async (req, res, next) => {
    try {
        res.json(await eventoService.getAllEventos());
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ message: 'El id debe ser numérico' });
    try {
        const result = await eventoService.getEventoById(id);
        if (!result) return res.status(404).json({ message: 'Evento no encontrado' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorTexto = async (req, res, next) => {
    try {
        res.json(await eventoService.getEventosByTexto(req.params.texto));
    } catch (err) {
        next(err);
    }
};

export const obtenerPorTipo = async (req, res, next) => {
    try {
        res.json(await eventoService.getEventosByTipo(req.params.tipo));
    } catch (err) {
        next(err);
    }
};

export const obtenerPorRangoFechas = async (req, res, next) => {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) {
        return res.status(400).json({ message: 'Parámetros obligatorios: inicio y fin (YYYY-MM-DD)' });
    }
    if (!fechaValida(inicio) || !fechaValida(fin)) {
        return res.status(400).json({ message: 'inicio y fin deben tener formato YYYY-MM-DD' });
    }
    if (fin < inicio) {
        return res.status(400).json({ message: 'fin no puede ser menor que inicio' });
    }
    try {
        res.json(await eventoService.getEventosByRangoFechas(inicio, fin));
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    const error = validarEvento(req.body);
    if (error) return res.status(400).json({ message: error });

    try {
        const { nombre, tipo, fechaInicio, fechaFin } = req.body;
        const nuevo = await eventoService.postCrearEvento({
            nombre: nombre.trim(),
            tipo: tipo.trim(),
            fechaInicio,
            fechaFin
        });
        res.status(201).json(nuevo);
    } catch (err) {
        manejarError(err, res, next);
    }
};

export const actualizar = async (req, res, next) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ message: 'El id debe ser numérico' });

    const error = validarEvento(req.body);
    if (error) return res.status(400).json({ message: error });

    try {
        const { nombre, tipo, fechaInicio, fechaFin } = req.body;
        const actualizado = await eventoService.actualizarEvento(id, {
            nombre: nombre.trim(),
            tipo: tipo.trim(),
            fechaInicio,
            fechaFin
        });
        if (!actualizado) return res.status(404).json({ message: 'Evento no encontrado' });
        res.json(actualizado);
    } catch (err) {
        manejarError(err, res, next);
    }
};

export const eliminar = async (req, res, next) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ message: 'El id debe ser numérico' });
    try {
        const eliminado = await eventoService.eliminarEvento(id);
        if (!eliminado) return res.status(404).json({ message: 'Evento no encontrado' });
        res.json({ message: 'Evento eliminado exitosamente', evento: eliminado });
    } catch (err) {
        next(err);
    }
};