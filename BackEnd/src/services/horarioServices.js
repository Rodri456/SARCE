import { pool } from '../db.js';

// Estructura base de consulta con JOINs para traer contexto completo
const BASE_SELECT = `
    SELECT 
        h.id AS horario_id,
        h.dia_semana,
        h.hora_inicio,
        h.hora_fin,
        h.asignacion_id,
        g.id AS grado_id,
        g.nombre AS grado_nombre,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        u.id AS docente_id,
        u.nombre AS docente_nombre
    FROM horario h
    INNER JOIN asignacion a ON h.asignacion_id = a.id
    INNER JOIN grado g ON a.grado_id = g.id
    INNER JOIN materia m ON a.materia_id = m.id
    INNER JOIN docente d ON a.docente_id = d.usuario_id
    INNER JOIN usuario u ON d.usuario_id = u.id
`;

// Obtener todos los horarios
export const getAllHorarios = async () => {
    const query = `${BASE_SELECT} ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query);
    return result.rows;
};

// Buscar por ID
export const getHorarioById = async (id) => {
    const query = `${BASE_SELECT} WHERE h.id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
};

// Buscar por Grado ID
export const getHorariosByGrado = async (gradoId) => {
    const query = `${BASE_SELECT} WHERE a.grado_id = $1 ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query, [gradoId]);
    return result.rows;
};

// Buscar por Materia ID
export const getHorariosByMateria = async (materiaId) => {
    const query = `${BASE_SELECT} WHERE a.materia_id = $1 ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query, [materiaId]);
    return result.rows;
};

// Buscar por Docente ID (usuario_id)
export const getHorariosByDocente = async (docenteId) => {
    const query = `${BASE_SELECT} WHERE a.docente_id = $1 ORDER BY h.dia_semana, h.hora_inicio ASC;`;
    const result = await pool.query(query, [docenteId]);
    return result.rows;
};

// Buscar por Día de la semana (Lunes, Martes, etc.)
export const getHorariosByDiaSemana = async (dia) => {
    const query = `${BASE_SELECT} WHERE LOWER(h.dia_semana) = LOWER($1) ORDER BY h.hora_inicio ASC;`;
    const result = await pool.query(query, [dia]);
    return result.rows;
};

// Buscar por Hora de Inicio
export const getHorariosByHoraInicio = async (horaInicio) => {
    const query = `${BASE_SELECT} WHERE h.hora_inicio = $1 ORDER BY h.dia_semana ASC;`;
    const result = await pool.query(query, [horaInicio]);
    return result.rows;
};

// Buscar por Hora de Fin
export const getHorariosByHoraFin = async (horaFin) => {
    const query = `${BASE_SELECT} WHERE h.hora_fin = $1 ORDER BY h.dia_semana ASC;`;
    const result = await pool.query(query, [horaFin]);
    return result.rows;
};

// Crear Horario
export const postCrearHorario = async (asignacionId, diaSemana, horaInicio, horaFin) => {
    const query = `
        INSERT INTO horario (asignacion_id, dia_semana, hora_inicio, hora_fin)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [asignacionId, diaSemana, horaInicio, horaFin];
    const result = await pool.query(query, values);
    return await getHorarioById(result.rows[0].id);
};

// Actualizar Horario
export const actualizarHorario = async (id, asignacionId, diaSemana, horaInicio, horaFin) => {
    const query = `
        UPDATE horario
        SET asignacion_id = $1,
            dia_semana = $2,
            hora_inicio = $3,
            hora_fin = $4
        WHERE id = $5
        RETURNING id;
    `;
    const values = [asignacionId, diaSemana, horaInicio, horaFin, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return null;
    return await getHorarioById(id);
};

// Eliminar Horario
export const eliminarHorario = async (id) => {
    const query = `DELETE FROM horario WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        const error = new Error('Horario no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Horario eliminado exitosamente', horario: result.rows[0] };
};