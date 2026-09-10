import * as materiaService from '../services/materiaServices.js';

export const obtenerTodas = async (req, res, next) => {
    try {
        const result = await materiaService.getAllMaterias();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await materiaService.getMateriaById(id);
        if (!result) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorNombre = async (req, res, next) => {
    const { nombre } = req.params;
    try {
        const result = await materiaService.getMateriaByNombre(nombre);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorGradoId = async (req, res, next) => {
    const { gradoId } = req.params;
    try {
        const result = await materiaService.getMateriasByGradoId(gradoId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorEstadoPerfil = async (req, res, next) => {
    const { estado } = req.params;
    try {
        const result = await materiaService.getMateriasByEstadoPerfil(estado);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorFecha = async (req, res, next) => {
    const { fecha } = req.params;
    try {
        const result = await materiaService.getMateriasByFecha(fecha);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ message: 'El campo nombre es obligatorio' });
        }
        const newMateria = await materiaService.postCrearMateria(nombre);
        res.status(201).json(newMateria);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ message: 'El campo nombre es obligatorio' });
        }

        const updatedMateria = await materiaService.actualizarMateria(id, nombre);

        if (!updatedMateria) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }

        return res.status(200).json(updatedMateria);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await materiaService.eliminarMateria(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};