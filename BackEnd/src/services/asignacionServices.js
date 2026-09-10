import { pool } from '../db.js';

// Estructura base para consultar Asignaciones con sus JOINs
const BASE_SELECT = `
    SELECT 
        a.id AS asignacion_id,
        -- Datos del Docente
        u.id AS docente_id,
        u.nombre AS docente_nombre,
        u.correo AS docente_correo,
        -- Datos de la Materia
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        -- Datos del Grado
        g.id AS grado_id,
        g.nombre AS grado_nombre,
        a.created_at AS fecha_asignacion
    FROM asignacion a
    INNER JOIN docente d ON a.docente_id = d.usuario_id
    INNER JOIN usuario u ON d.usuario_id = u.id
    INNER JOIN materia m ON a.materia_id = m.id
    INNER JOIN grado g ON a.grado_id = g.id
`;

// Obtener todas las asignaciones
export const getAllAsignaciones = async () => {
    const query = `${BASE_SELECT} ORDER BY a.id ASC;`;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar por ID exacto
export const getAsignacionById = async (id) => {
    const query = `${BASE_SELECT} WHERE a.id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar por Docente (Búsqueda flexible por nombre o correo)
export const getAsignacionesByDocente = async (texto) => {
    const buscar = `%${texto}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE u.nombre ILIKE $1 OR u.correo ILIKE $1
        ORDER BY a.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Materia (Búsqueda flexible por nombre)
export const getAsignacionesByMateria = async (materia) => {
    const buscar = `%${materia}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE m.nombre ILIKE $1 
        ORDER BY a.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Grado (Búsqueda flexible por nombre)
export const getAsignacionesByGrado = async (grado) => {
    const buscar = `%${grado}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE g.nombre ILIKE $1 
        ORDER BY a.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Crear Asignación
export const postCrearAsignacion = async (docenteId, materiaId, gradoId) => {
    const query = `
        INSERT INTO asignacion (docente_id, materia_id, grado_id)
        VALUES ($1, $2, $3)
        RETURNING id;
    `;
    const values = [docenteId, materiaId, gradoId];
    const result = await pool.query(query, values);
    return await getAsignacionById(result.rows[0].id);
};

// Actualizar Asignación
export const actualizarAsignacion = async (id, docenteId, materiaId, gradoId) => {
    const query = `
        UPDATE asignacion
        SET docente_id = $1,
            materia_id = $2,
            grado_id = $3
        WHERE id = $4
        RETURNING id;
    `;
    const values = [docenteId, materiaId, gradoId, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;
    return await getAsignacionById(id);
};

// Eliminar Asignación
export const eliminarAsignacion = async (id) => {
    const query = `DELETE FROM asignacion WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Asignación no encontrada');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Asignación eliminada exitosamente', asignacion: result.rows[0] };
};