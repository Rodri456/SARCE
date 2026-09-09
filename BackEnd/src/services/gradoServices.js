import { pool } from '../db.js';

// Obtener todos los grados
export const getAllGrados = async () => {
    const result = await pool.query('SELECT * FROM grado ORDER BY id ASC');
    return result.rows;
};

// Obtener grado por ID
export const getGradoById = async (id) => {
    const result = await pool.query('SELECT * FROM grado WHERE id = $1', [id]);
    return result.rows[0] || null;
};

// Obtener grado por nombre
export const getBuscarNombre = async (nombre) => {
    const buscar = `%${nombre}%`;
    const result = await pool.query('SELECT * FROM grado WHERE nombre ILIKE $1', [buscar]);
    return result.rows;
};

// Crear un nuevo grado
export const postCrearGrado = async (nombre) => {
    const query = `INSERT INTO grado (nombre) VALUES ($1) RETURNING *`;
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
};

// Actualizar un grado
export const actualizarGrado = async (id, nombre) => {
    const query = `
        UPDATE grado 
        SET nombre = $1 
        WHERE id = $2 
        RETURNING *;
    `;
    const result = await pool.query(query, [nombre, id]);
    return result.rows[0] || null;
};

// Eliminar un grado
export const eliminarGrado = async (id) => {
    const result = await pool.query('DELETE FROM grado WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
        const error = new Error('Grado no encontrado');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Grado eliminado exitosamente', grado: result.rows[0] };
};