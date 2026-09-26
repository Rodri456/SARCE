import { pool } from '../db.js';

// Obtener todos los grados ordenados por ID
export const getAllGrados = async () => {
    const query = 'SELECT id, nombre FROM grado ORDER BY id ASC;';
    const result = await pool.query(query);
    return result.rows;
};

// Obtener grado por ID
export const getGradoById = async (id) => {
    const query = 'SELECT id, nombre FROM grado WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar grados por nombre (coincidencia parcial insensible a mayúsculas)
export const getBuscarNombre = async (nombre) => {
    const buscar = `%${nombre.trim()}%`;
    const query = 'SELECT id, nombre FROM grado WHERE nombre ILIKE $1 ORDER BY id ASC;';
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Crear un nuevo grado
export const postCrearGrado = async (nombre) => {
    const query = 'INSERT INTO grado (nombre) VALUES ($1) RETURNING id, nombre;';
    const result = await pool.query(query, [nombre.trim()]);
    return result.rows[0];
};

// Actualizar un grado existente
export const actualizarGrado = async (id, nombre) => {
    const query = `
        UPDATE grado 
        SET nombre = $1 
        WHERE id = $2 
        RETURNING id, nombre;
    `;
    const result = await pool.query(query, [nombre.trim(), id]);
    return result.rows[0] || null;
};

// Eliminar un grado por ID
export const eliminarGrado = async (id) => {
    const query = 'DELETE FROM grado WHERE id = $1 RETURNING id, nombre;';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Grado no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Grado eliminado exitosamente', grado: result.rows[0] };
};