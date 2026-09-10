import { pool } from '../db.js';

// Estructura base para consultar Calificaciones con todos sus JOINs
const BASE_SELECT = `
    SELECT 
        c.id AS calificacion_id,
        c.nota,
        c.periodo,
        c.created_at AS fecha_registro,
        -- Datos del Estudiante
        u_est.id AS estudiante_id,
        u_est.nombre AS estudiante_nombre,
        u_est.correo AS estudiante_correo,
        -- Datos del Grado
        g.id AS grado_id,
        g.nombre AS grado_nombre,
        -- Datos de la Materia
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        -- Datos del Docente
        u_doc.id AS docente_id,
        u_doc.nombre AS docente_nombre
    FROM calificacion c
    INNER JOIN estudiante e ON c.estudiante_id = e.usuario_id
    INNER JOIN usuario u_est ON e.usuario_id = u_est.id
    INNER JOIN asignacion a ON c.asignacion_id = a.id
    INNER JOIN grado g ON a.grado_id = g.id
    INNER JOIN materia m ON a.materia_id = m.id
    INNER JOIN docente d ON a.docente_id = d.usuario_id
    INNER JOIN usuario u_doc ON d.usuario_id = u_doc.id
`;

// Obtener todas las calificaciones
export const getAllCalificaciones = async () => {
    const query = `${BASE_SELECT} ORDER BY c.id ASC;`;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar por ID exacto
export const getCalificacionById = async (id) => {
    const query = `${BASE_SELECT} WHERE c.id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar por Estudiante (Búsqueda flexible por nombre o correo)
export const getCalificacionesByEstudiante = async (texto) => {
    const buscar = `%${texto}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE u_est.nombre ILIKE $1 OR u_est.correo ILIKE $1
        ORDER BY c.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Docente (Búsqueda flexible por nombre o correo)
export const getCalificacionesByDocente = async (texto) => {
    const buscar = `%${texto}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE u_doc.nombre ILIKE $1 OR u_doc.correo ILIKE $1
        ORDER BY c.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Materia (Búsqueda flexible por nombre)
export const getCalificacionesByMateria = async (materia) => {
    const buscar = `%${materia}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE m.nombre ILIKE $1 
        ORDER BY c.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Grado (Búsqueda flexible por nombre)
export const getCalificacionesByGrado = async (grado) => {
    const buscar = `%${grado}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE g.nombre ILIKE $1 
        ORDER BY c.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Periodo (Búsqueda flexible, ej: 'Periodo 1', '1', 'P1')
export const getCalificacionesByPeriodo = async (periodo) => {
    const buscar = `%${periodo}%`;
    const query = `
        ${BASE_SELECT} 
        WHERE c.periodo ILIKE $1 
        ORDER BY c.id ASC;
    `;
    const result = await pool.query(query, [buscar]);
    return result.rows;
};

// Buscar por Nota exacta o Rango de Nota
export const getCalificacionesByNota = async (notaMinima, notaMaxima) => {
    if (notaMaxima !== undefined) {
        const query = `${BASE_SELECT} WHERE c.nota BETWEEN $1 AND $2 ORDER BY c.nota DESC;`;
        const result = await pool.query(query, [notaMinima, notaMaxima]);
        return result.rows;
    }
    const query = `${BASE_SELECT} WHERE c.nota = $1 ORDER BY c.id ASC;`;
    const result = await pool.query(query, [notaMinima]);
    return result.rows;
};

// Crear Calificación
export const postCrearCalificacion = async (estudianteId, asignacionId, nota, periodo) => {
    const query = `
        INSERT INTO calificacion (estudiante_id, asignacion_id, nota, periodo)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
    `;
    const values = [estudianteId, asignacionId, nota, periodo];
    const result = await pool.query(query, values);
    return await getCalificacionById(result.rows[0].id);
};

// Actualizar Calificación
export const actualizarCalificacion = async (id, estudianteId, asignacionId, nota, periodo) => {
    const query = `
        UPDATE calificacion
        SET estudiante_id = $1,
            asignacion_id = $2,
            nota = $3,
            periodo = $4
        WHERE id = $5
        RETURNING id;
    `;
    const values = [estudianteId, asignacionId, nota, periodo, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;
    return await getCalificacionById(id);
};

// Eliminar Calificación
export const eliminarCalificacion = async (id) => {
    const query = `DELETE FROM calificacion WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Calificación no encontrada');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Calificación eliminada exitosamente', calificacion: result.rows[0] };
};