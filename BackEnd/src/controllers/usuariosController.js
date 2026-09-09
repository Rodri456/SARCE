import * as usuariosService from '../services/usuarioServices.js';

export const obtenerTodos = async (req, res) => {
    try {
        const result = await usuariosService.getAllUsuarios();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorCorreo = async (req, res) => {
    const { correo } = req.params;
    try {
        const result = await usuariosService.getUsuarioByCorreo(correo);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorNombre = async (req, res) => {
    const { nombre } = req.params;
    try {
        const result = await usuariosService.getBuscarNombre(nombre);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorRol = async (req, res) => {
    const { rol } = req.params;
    try {
        const result = await usuariosService.getUsuariosByRol(rol);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res) => {
    try {
        const { nombre, correo, contrasena, rol } = req.body;
        const newUsuario = await usuariosService.postCrearUsuario(nombre, correo, contrasena, rol);
        res.status(201).json(newUsuario);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUsuario = await usuariosService.actualizarUsuario(id, req.body);

        if (!updatedUsuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.status(200).json(updatedUsuario);
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await usuariosService.eliminarUsuario(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};