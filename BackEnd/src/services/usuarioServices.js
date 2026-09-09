import { pool } from '../db.js';

// Todos los usuarios
export const getAllUsuarios = async () => {
    const result = await pool.query('SELECT * FROM usuario');
    return result.rows;
};

// Buscar por correo
export const getUsuarioByCorreo = async (correo) => {
    const result = await pool.query('SELECT * FROM usuario WHERE correo = $1', [correo]);
    return result.rows;
};

// Buscar por nombre
export const getBuscarNombre = async (nombre) => {
    const buscar = `%${nombre}%`;
    const result = await pool.query('SELECT * FROM usuario WHERE nombre ILIKE $1', [buscar]);
    return result.rows;
};

// Por Rol
export const getUsuariosByRol = async (rol) => {
    const result = await pool.query('SELECT * FROM usuario WHERE rol = $1', [rol]);
    return result.rows;
};

// Crear usuario
export const postCrearUsuario = async (nombre, correo, contrasena, rol) => {
    const query = `INSERT INTO usuario (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await pool.query(query, [nombre, correo, contrasena, rol]);
    return result.rows[0];
};

// Actualizar usuario
export const actualizarUsuario = async (id, datosUsuario) => {
    const { nombre, correo, contrasena, rol } = datosUsuario;
    const query = `
        UPDATE usuario 
        SET nombre = $1, 
            correo = $2, 
            contrasena = $3, 
            rol = $4,
            updated_at = NOW()
        WHERE id = $5 
        RETURNING *;
    `;
    const values = [nombre, correo, contrasena, rol, id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

// Eliminar usuario
export const eliminarUsuario = async (id) => {
    const result = await pool.query('DELETE FROM usuario WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado');
    }
    return { message: 'Usuario eliminado exitosamente', usuario: result.rows[0] };
};