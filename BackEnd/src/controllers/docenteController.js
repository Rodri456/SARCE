import * as docenteService from '../services/docenteServices.js';

export const obtenerTodos = async (req, res, next) => {
    try {
        const result = await docenteService.getAllDocentes();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await docenteService.getDocenteById(id);
        if (!result) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorCorreo = async (req, res, next) => {
    const { correo } = req.params;
    try {
        const result = await docenteService.getDocenteByCorreo(correo);
        if (!result) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorNombre = async (req, res, next) => {
    const { nombre } = req.params;
    try {
        const result = await docenteService.getDocentesByNombre(nombre);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorFecha = async (req, res, next) => {
    const { fecha } = req.params;
    try {
        const result = await docenteService.getDocentesByFecha(fecha);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { nombre, correo, contrasena } = req.body;

        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({ message: 'Los campos nombre, correo y contraseña son obligatorios' });
        }

        const newDocente = await docenteService.postCrearDocente(nombre, correo, contrasena);
        res.status(201).json(newDocente);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, correo, contrasena } = req.body;

        // Validar que vengan todos los campos obligatorios
        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({ 
                message: 'Todos los campos son requeridos para la actualización' 
            });
        }

        // AQUÍ VA LA LÍNEA: Llama al servicio pasando el ID y los datos requeridos
        const updatedDocente = await docenteService.actualizarDocente(id, nombre, correo, contrasena);

        // Si la consulta no devuelve filas (por ejemplo, el ID no existe o no es un docente)
        if (!updatedDocente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }

        return res.status(200).json(updatedDocente);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await docenteService.eliminarDocente(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};