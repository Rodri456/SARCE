import { pool } from '../db.js';

// Todos las materias
export const getAllMaterias = async () => {
    const result = await pool.query('SELECT * FROM materia ORDER BY id ASC');
    return result.rows;
};

// Buscar por ID
export const getMateriaById = async (id) => {
    const result = await pool.query('SELECT * FROM materia WHERE id = $1', [id]);
    return result.rows[0] || null;
};

// Buscar por Nombre (coincidencia parcial)
export const getMateriaByNombre = async (nombre) => {
    const buscar = `%${nombre}%`;
    const result = await pool.query('SELECT * FROM materia WHERE nombre ILIKE $1', [buscar]);
    return result.rows;
};

// Buscar materias dictadas en un Grado específico (vía asignacion)
export const getMateriasByGradoId = async (gradoId) => {
    const query = `
        SELECT DISTINCT m.* 
        FROM materia m
        INNER JOIN asignacion a ON m.id = a.materia_id
        WHERE a.grado_id = $1
        ORDER BY m.id ASC
    `;
    const result = await pool.query(query, [gradoId]);
    return result.rows;
};

// Buscar materias cursadas por estudiantes según su estado de perfil (vía asignacion y estudiante)
export const getMateriasByEstadoPerfil = async (estadoPerfil) => {
    const query = `
        SELECT DISTINCT m.*
        FROM materia m
        INNER JOIN asignacion a ON m.id = a.materia_id
        INNER JOIN estudiante e ON a.grado_id = e.grado_id
        WHERE e.estado_perfil = $1
        ORDER BY m.id ASC
    `;
    const result = await pool.query(query, [estadoPerfil]);
    return result.rows;
};

// Buscar materias creadas en una Fecha específica (Formato YYYY-MM-DD)
export const getMateriasByFecha = async (fecha) => {
    const query = 'SELECT * FROM materia WHERE DATE(created_at) = $1 ORDER BY id ASC';
    const result = await pool.query(query, [fecha]);
    return result.rows;
};

// Crear materia
export const postCrearMateria = async (nombre) => {
    const query = `INSERT INTO materia (nombre) VALUES ($1) RETURNING *`;
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
};

// Actualizar materia
export const actualizarMateria = async (id, nombre) => {
    const query = `
        UPDATE materia 
        SET nombre = $1 
        WHERE id = $2 
        RETURNING *;
    `;
    const result = await pool.query(query, [nombre, id]);
    return result.rows[0] || null;
};

// Eliminar materia
export const eliminarMateria = async (id) => {
    const result = await pool.query('DELETE FROM materia WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
        const error = new Error('Materia no encontrada');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Materia eliminada exitosamente', materia: result.rows[0] };
};