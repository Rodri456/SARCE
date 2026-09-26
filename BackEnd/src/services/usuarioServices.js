import { pool } from '../db.js';

// Obtener todos los usuarios
export const getAllUsuarios = async () => {
    const result = await pool.query('SELECT id, nombre, correo, rol, created_at, updated_at FROM usuario ORDER BY id ASC;');
    return result.rows;
};

// Buscar usuario por ID
export const getUsuarioById = async (id) => {
    const result = await pool.query(
        'SELECT id, nombre, correo, rol, created_at, updated_at FROM usuario WHERE id = $1;', 
        [id]
    );
    return result.rows[0] || null;
};

// Buscar por correo
export const getUsuarioByCorreo = async (correo) => {
    const result = await pool.query(
        'SELECT id, nombre, correo, rol, created_at, updated_at FROM usuario WHERE correo = $1;', 
        [correo]
    );
    return result.rows[0] || null;
};

// Buscar por nombre (coincidencia parcial)
export const getBuscarNombre = async (nombre) => {
    const buscar = `%${nombre}%`;
    const result = await pool.query(
        'SELECT id, nombre, correo, rol, created_at, updated_at FROM usuario WHERE nombre ILIKE $1 ORDER BY id ASC;', 
        [buscar]
    );
    return result.rows;
};

// Filtrar por Rol
export const getUsuariosByRol = async (rol) => {
    const result = await pool.query(
        'SELECT id, nombre, correo, rol, created_at, updated_at FROM usuario WHERE rol::text = $1 ORDER BY id ASC;', 
        [rol]
    );
    return result.rows;
};

// Crear usuario
export const postCrearUsuario = async (nombre, correo, contrasena, rol) => {
    const query = `
        INSERT INTO usuario (nombre, correo, contrasena, rol) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, nombre, correo, rol, created_at, updated_at;
    `;
    const result = await pool.query(query, [nombre, correo, contrasena, rol]);
    return result.rows[0];
};

// Actualizar usuario
export const actualizarUsuario = async (id, datosUsuario) => {
    const { nombre, correo, contrasena, rol } = datosUsuario;
    const query = `
        UPDATE usuario 
        SET nombre = COALESCE($1, nombre), 
            correo = COALESCE($2, correo), 
            contrasena = COALESCE($3, contrasena), 
            rol = COALESCE($4, rol),
            updated_at = NOW()
        WHERE id = $5 
        RETURNING id, nombre, correo, rol, created_at, updated_at;
    `;
    const values = [nombre, correo, contrasena, rol, id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

// Eliminar usuario
export const eliminarUsuario = async (id) => {
    const result = await pool.query('DELETE FROM usuario WHERE id = $1 RETURNING id, nombre, correo;', [id]);
    if (result.rowCount === 0) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Usuario eliminado exitosamente', usuario: result.rows[0] };
};