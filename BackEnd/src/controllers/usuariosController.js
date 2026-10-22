import * as usuariosService from '../services/usuarioServices.js';

export const obtenerTodos = async (req, res, next) => {
    try {
        const result = await usuariosService.getAllUsuarios();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { correo, contrasena, rol } = req.body;
 
        if (!correo || !contrasena) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }
 
        const usuario = await usuariosService.loginUsuario(correo, contrasena);
 
        if (!usuario) {
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        // Estudiantes con perfil desactivado no pueden iniciar sesión
        if (usuario.rol === 'estudiante' && usuario.estado_perfil && usuario.estado_perfil !== 'activo') {
            return res.status(403).json({
                message: 'Tu perfil está desactivado. Contacta a secretaría académica.'
            });
        }
 
        // Si el frontend indica un rol (pestaña seleccionada), debe coincidir
        if (rol && usuario.rol !== rol) {
            return res.status(403).json({
                message: `Este usuario no tiene perfil de ${rol}. Selecciona el perfil correcto.`
            });
        }
 
        res.status(200).json({ message: 'Inicio de sesión exitoso', usuario });
    } catch (err) {
        next(err);
    }
};

export const obtenerPorId = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await usuariosService.getUsuarioById(id);
        if (!result) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorCorreo = async (req, res, next) => {
    const { correo } = req.params;
    try {
        const result = await usuariosService.getUsuarioByCorreo(correo);
        if (!result) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorNombre = async (req, res, next) => {
    const { nombre } = req.params;
    try {
        const result = await usuariosService.getBuscarNombre(nombre);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const obtenerPorRol = async (req, res, next) => {
    const { rol } = req.params;
    try {
        const result = await usuariosService.getUsuariosByRol(rol);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        const { nombre, correo, contrasena, rol } = req.body;

        if (!nombre || !correo || !contrasena || !rol) {
            return res.status(400).json({ 
                message: 'Campos requeridos: nombre, correo, contrasena, rol' 
            });
        }

        const newUsuario = await usuariosService.postCrearUsuario(nombre, correo, contrasena, rol);
        res.status(201).json(newUsuario);
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
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

export const eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await usuariosService.eliminarUsuario(id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};