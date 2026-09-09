import * as gradosService from '../services/gradoServices.js';

export const obtenerTodos = async (req, res, next) => {
    try {
        const result = await gradosService.getAllGrados();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await gradosService.getGradoById(id);
        if (!result) {
            return res.status(404).json({ message: 'Grado no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorNombre = async (req, res, next) => {
    const { nombre } = req.params;
    try {
        const result = await gradosService.getBuscarNombre(nombre);
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

        const newGrado = await gradosService.postCrearGrado(nombre);
        res.status(201).json(newGrado);
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

        const updatedGrado = await gradosService.actualizarGrado(id, nombre);

        if (!updatedGrado) {
            return res.status(404).json({ message: 'Grado no encontrado' });
        }

        return res.status(200).json(updatedGrado);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await gradosService.eliminarGrado(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};