import * as calificacionService from '../services/calificacionServices.js';

export const obtenerTodas = async (req, res, next) => {
    try {
        const result = await calificacionService.getAllCalificaciones();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await calificacionService.getCalificacionById(id);
        if (!result) return res.status(404).json({ message: 'Calificación no encontrada' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorEstudiante = async (req, res, next) => {
    const { texto } = req.params;
    try {
        const result = await calificacionService.getCalificacionesByEstudiante(texto);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorDocente = async (req, res, next) => {
    const { texto } = req.params;
    try {
        const result = await calificacionService.getCalificacionesByDocente(texto);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorMateria = async (req, res, next) => {
    const { materia } = req.params;
    try {
        const result = await calificacionService.getCalificacionesByMateria(materia);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorGrado = async (req, res, next) => {
    const { grado } = req.params;
    try {
        const result = await calificacionService.getCalificacionesByGrado(grado);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorPeriodo = async (req, res, next) => {
    const { periodo } = req.params;
    try {
        const result = await calificacionService.getCalificacionesByPeriodo(periodo);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorNota = async (req, res, next) => {
    const { min, max } = req.query;
    try {
        const result = await calificacionService.getCalificacionesByNota(min, max);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { estudianteId, asignacionId, nota, periodo } = req.body;

        if (!estudianteId || !asignacionId || nota === undefined || !periodo) {
            return res.status(400).json({ 
                message: 'Campos requeridos: estudianteId, asignacionId, nota, periodo' 
            });
        }

        const nuevaCalificacion = await calificacionService.postCrearCalificacion(
            estudianteId, 
            asignacionId, 
            nota, 
            periodo
        );
        res.status(201).json(nuevaCalificacion);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estudianteId, asignacionId, nota, periodo } = req.body;

        if (!estudianteId || !asignacionId || nota === undefined || !periodo) {
            return res.status(400).json({ 
                message: 'Todos los campos son requeridos para actualizar la calificación' 
            });
        }

        const actualizada = await calificacionService.actualizarCalificacion(
            id, 
            estudianteId, 
            asignacionId, 
            nota, 
            periodo
        );

        if (!actualizada) return res.status(404).json({ message: 'Calificación no encontrada' });

        res.status(200).json(actualizada);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await calificacionService.eliminarCalificacion(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};