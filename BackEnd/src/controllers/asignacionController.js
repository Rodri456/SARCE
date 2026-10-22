import * as asignacionService from '../services/asignacionServices.js';

export const obtenerTodas = async (req, res, next) => {
    try {
        const result = await asignacionService.getAllAsignaciones();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await asignacionService.getAsignacionById(id);
        if (!result) return res.status(404).json({ message: 'Asignación no encontrada' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorDocente = async (req, res, next) => {
    const { texto } = req.params;
    try {
        const result = await asignacionService.getAsignacionesByDocente(texto);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorMateria = async (req, res, next) => {
    const { materia } = req.params;
    try {
        const result = await asignacionService.getAsignacionesByMateria(materia);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorGrado = async (req, res, next) => {
    const { grado } = req.params;
    try {
        const result = await asignacionService.getAsignacionesByGrado(grado);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { docenteId, materiaId, gradoId } = req.body;

        if (!docenteId || !materiaId || !gradoId) {
            return res.status(400).json({ 
                message: 'Campos requeridos: docenteId, materiaId, gradoId' 
            });
        }

        const nuevaAsignacion = await asignacionService.postCrearAsignacion(
            docenteId, 
            materiaId, 
            gradoId
        );
        res.status(201).json(nuevaAsignacion);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { docenteId, materiaId, gradoId } = req.body;

        if (!docenteId || !materiaId || !gradoId) {
            return res.status(400).json({ 
                message: 'Todos los campos son requeridos para actualizar la asignación' 
            });
        }

        const actualizada = await asignacionService.actualizarAsignacion(
            id, 
            docenteId, 
            materiaId, 
            gradoId
        );

        if (!actualizada) return res.status(404).json({ message: 'Asignación no encontrada' });

        res.status(200).json(actualizada);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await asignacionService.eliminarAsignacion(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const getAsignacionesByDocenteId = async (docenteId) => {
    const query = `
        ${BASE_SELECT}
        WHERE a.docente_id = $1
        ORDER BY g.nombre ASC, m.nombre ASC;
    `;
    const result = await pool.query(query, [docenteId]);
    return result.rows;
};
 
// ---- controllers/asignacionController.js  → agregar al final ----
export const obtenerPorDocenteId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await asignacionService.getAsignacionesByDocenteId(id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};