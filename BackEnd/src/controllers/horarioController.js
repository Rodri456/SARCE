import * as horarioService from '../services/horarioServices.js';

export const obtenerTodos = async (req, res, next) => {
    try {
        const result = await horarioService.getAllHorarios();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await horarioService.getHorarioById(id);
        if (!result) return res.status(404).json({ message: 'Horario no encontrado' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorGrado = async (req, res, next) => {
    const { gradoId } = req.params;
    try {
        const result = await horarioService.getHorariosByGrado(gradoId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorMateria = async (req, res, next) => {
    const { materiaId } = req.params;
    try {
        const result = await horarioService.getHorariosByMateria(materiaId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorDocente = async (req, res, next) => {
    const { docenteId } = req.params;
    try {
        const result = await horarioService.getHorariosByDocente(docenteId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorDiaSemana = async (req, res, next) => {
    const { dia } = req.params;
    try {
        const result = await horarioService.getHorariosByDiaSemana(dia);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorHoraInicio = async (req, res, next) => {
    const { hora } = req.params;
    try {
        const result = await horarioService.getHorariosByHoraInicio(hora);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorHoraFin = async (req, res, next) => {
    const { hora } = req.params;
    try {
        const result = await horarioService.getHorariosByHoraFin(hora);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { gradoId, materiaId, docenteId, diaSemana, horaInicio, horaFin } = req.body;

        if (!gradoId || !materiaId || !docenteId || !diaSemana || !horaInicio || !horaFin) {
            return res.status(400).json({ 
                message: 'Campos requeridos: gradoId, materiaId, docenteId, diaSemana, horaInicio, horaFin' 
            });
        }

        const nuevoHorario = await horarioService.postCrearHorario(
            gradoId, 
            materiaId, 
            docenteId, 
            diaSemana, 
            horaInicio, 
            horaFin
        );
        res.status(201).json(nuevoHorario);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { gradoId, materiaId, docenteId, diaSemana, horaInicio, horaFin } = req.body;

        if (!gradoId || !materiaId || !docenteId || !diaSemana || !horaInicio || !horaFin) {
            return res.status(400).json({ 
                message: 'Todos los campos son obligatorios para actualizar el horario' 
            });
        }

        const actualizado = await horarioService.actualizarHorario(
            id, 
            gradoId, 
            materiaId, 
            docenteId, 
            diaSemana, 
            horaInicio, 
            horaFin
        );

        if (!actualizado) return res.status(404).json({ message: 'Horario no encontrado' });

        res.status(200).json(actualizado);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await horarioService.eliminarHorario(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};