import * as eventoService from '../services/eventoCalendarioServices.js';

export const obtenerTodos = async (req, res, next) => {
    try {
        const result = await eventoService.getAllEventos();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await eventoService.getEventoById(id);
        if (!result) return res.status(404).json({ message: 'Evento no encontrado' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorTexto = async (req, res, next) => {
    const { texto } = req.params;
    try {
        const result = await eventoService.getEventosByTexto(texto);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorTipo = async (req, res, next) => {
    const { tipo } = req.params;
    try {
        const result = await eventoService.getEventosByTipo(tipo);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorLugar = async (req, res, next) => {
    const { lugar } = req.params;
    try {
        const result = await eventoService.getEventosByLugar(lugar);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorCreador = async (req, res, next) => {
    const { creador } = req.params;
    try {
        const result = await eventoService.getEventosByCreador(creador);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorGrado = async (req, res, next) => {
    const { grado } = req.params;
    try {
        const result = await eventoService.getEventosByGrado(grado);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorRangoFechas = async (req, res, next) => {
    const { inicio, fin } = req.query;
    try {
        if (!inicio || !fin) {
            return res.status(400).json({ message: 'Parámetros obligatorios: inicio y fin (YYYY-MM-DD)' });
        }
        const result = await eventoService.getEventosByRangoFechas(inicio, fin);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, creadorId, gradoId } = req.body;

        if (!titulo || !tipo || !fechaInicio || !fechaFin || !creadorId) {
            return res.status(400).json({ 
                message: 'Campos requeridos: titulo, tipo, fechaInicio, fechaFin, creadorId' 
            });
        }

        const nuevoEvento = await eventoService.postCrearEvento(
            titulo, 
            descripcion, 
            tipo, 
            fechaInicio, 
            fechaFin, 
            lugar, 
            creadorId, 
            gradoId
        );
        res.status(201).json(nuevoEvento);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, creadorId, gradoId } = req.body;

        if (!titulo || !tipo || !fechaInicio || !fechaFin || !creadorId) {
            return res.status(400).json({ 
                message: 'Campos requeridos: titulo, tipo, fechaInicio, fechaFin, creadorId' 
            });
        }

        const actualizado = await eventoService.actualizarEvento(
            id, 
            titulo, 
            descripcion, 
            tipo, 
            fechaInicio, 
            fechaFin, 
            lugar, 
            creadorId, 
            gradoId
        );

        if (!actualizado) return res.status(404).json({ message: 'Evento no encontrado' });

        res.status(200).json(actualizado);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await eventoService.eliminarEvento(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};