import * as estudianteService from '../services/estudianteServices.js';

// Valores permitidos para estudiante.estado_perfil
const ESTADOS_VALIDOS = ['activo', 'inactivo', 'retirado'];

export const obtenerTodos = async (req, res, next) => {
    try {
        const result = await estudianteService.getAllEstudiantes();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await estudianteService.getEstudianteById(id);
        if (!result) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorCorreo = async (req, res, next) => {
    const { correo } = req.params;
    try {
        const result = await estudianteService.getEstudianteByCorreo(correo);
        if (!result) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorNombre = async (req, res, next) => {
    const { nombre } = req.params;
    try {
        const result = await estudianteService.getEstudiantesByNombre(nombre);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorGradoId = async (req, res, next) => {
    const { gradoId } = req.params;
    try {
        const result = await estudianteService.getEstudiantesByGradoId(gradoId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorEstadoPerfil = async (req, res, next) => {
    const { estado } = req.params;
    try {
        const result = await estudianteService.getEstudiantesByEstadoPerfil(estado);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorFecha = async (req, res, next) => {
    const { fecha } = req.params;
    try {
        const result = await estudianteService.getEstudiantesByFecha(fecha);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// Lista de estudiantes de un grado, solo si el docente lo tiene asignado
export const obtenerPorDocenteYGrado = async (req, res, next) => {
    const { docenteId, gradoId } = req.params;
    try {
        const permitido = await estudianteService.docenteImparteEnGrado(docenteId, gradoId);
        if (!permitido) {
            return res.status(403).json({ message: 'No tienes asignado este grado.' });
        }
        const result = await estudianteService.getEstudiantesByGradoId(gradoId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { nombre, correo, contrasena, gradoId, estadoPerfil } = req.body;

        if (!nombre || !correo || !contrasena || !gradoId) {
            return res.status(400).json({ 
                message: 'Los campos nombre, correo, contraseña y gradoId son obligatorios' 
            });
        }

        const newEstudiante = await estudianteService.postCrearEstudiante(
            nombre, 
            correo, 
            contrasena, 
            gradoId, 
            estadoPerfil
        );
        res.status(201).json(newEstudiante);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, correo, contrasena, gradoId, estadoPerfil } = req.body;

        if (!nombre || !correo || !contrasena || !gradoId || !estadoPerfil) {
            return res.status(400).json({ 
                message: 'Todos los campos son requeridos para actualizar al estudiante' 
            });
        }

        const updatedEstudiante = await estudianteService.actualizarEstudiante(
            id, 
            nombre, 
            correo, 
            contrasena, 
            gradoId, 
            estadoPerfil
        );

        if (!updatedEstudiante) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }

        return res.status(200).json(updatedEstudiante);
    } catch (err) {
        next(err);
    }
};

// Cambiar el estado del perfil, solo si el estudiante es de un grado del docente
export const cambiarEstado = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estadoPerfil, docenteId } = req.body;

        if (!docenteId) {
            return res.status(400).json({ message: 'El campo docenteId es requerido' });
        }
        if (!ESTADOS_VALIDOS.includes(estadoPerfil)) {
            return res.status(400).json({
                message: `estadoPerfil debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`
            });
        }

        const estudiante = await estudianteService.getEstudianteById(id);
        if (!estudiante) return res.status(404).json({ message: 'Estudiante no encontrado' });

        const permitido = await estudianteService.docenteImparteEnGrado(docenteId, estudiante.grado_id);
        if (!permitido) {
            return res.status(403).json({
                message: 'Solo puedes cambiar el estado de estudiantes de tus grados asignados.'
            });
        }

        const actualizado = await estudianteService.cambiarEstadoPerfil(id, estadoPerfil);
        res.status(200).json(actualizado);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await estudianteService.eliminarEstudiante(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};